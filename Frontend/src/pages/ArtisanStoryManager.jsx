import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Loader2, Edit, Trash2, ExternalLink, RefreshCw, Search, Filter, ArrowUpDown, ImageOff } from 'lucide-react';
import { getApiUrl } from "@/lib/api";
import { useTranslation } from '@/hooks/useTranslation';

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function ArtisanStoryManager() {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // UI state
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [deletingId, setDeletingId] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Pagination
  const pageSize = 10;
  const [page, setPage] = useState(1);

  async function fetchMyStories() {
    if (!token) {
      setStories([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setFetchError('');
      const res = await fetch(getApiUrl(`/api/stories/my-stories`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(t('artisanStories.fetchFailed'));
      const data = await res.json();
      setStories(Array.isArray(data) ? data : []);
    } catch (error) {
      setFetchError(error.message || t('artisanStories.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMyStories();
  }, [token]);

  const filteredSorted = useMemo(() => {
    let list = [...stories];

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => String(s?.title || '').toLowerCase().includes(q) || String(s?._id || '').toLowerCase().includes(q));
    }

    if (statusFilter !== 'all') {
      list = list.filter((s) => String(s?.status || '').toUpperCase() === statusFilter);
    }

    list.sort((a, b) => {
      const aDate = new Date(a?.createdAt || 0).getTime();
      const bDate = new Date(b?.createdAt || 0).getTime();
      switch (sortBy) {
        case 'oldest':
          return aDate - bDate;
        case 'title_az':
          return String(a?.title || '').localeCompare(String(b?.title || ''));
        case 'title_za':
          return String(b?.title || '').localeCompare(String(a?.title || ''));
        case 'newest':
        default:
          return bDate - aDate;
      }
    });

    return list;
  }, [stories, query, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, currentPage]);

  async function handleDelete(storyId) {
    if (!token || !storyId) return;
    try {
      setDeletingId(storyId);
      const res = await fetch(getApiUrl(`/api/stories/${storyId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(t('artisanStories.deleteFailed'));
      setStories((prev) => prev.filter((s) => s._id !== storyId));
    } catch (err) {
      setFetchError(err.message || t('artisanStories.deleteFailed'));
    } finally {
      setDeletingId('');
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await fetchMyStories();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('artisanStories.title')}</h1>
          <p className="text-muted-foreground">{t('artisanStories.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={refreshing || loading}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {t('artisanStories.refresh')}
          </Button>
          <Link to="/dashboard/stories/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('artisanStories.create')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2 rounded-md border px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={t('artisanStories.searchPlaceholder')}
                className="border-none shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder={t('artisanStories.status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('artisanStories.statusAll')}</SelectItem>
                    <SelectItem value="PUBLISHED">{t('artisanStories.published')}</SelectItem>
                    <SelectItem value="DRAFT">{t('artisanStories.draft')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={sortBy}
                  onValueChange={(v) => {
                    setSortBy(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('artisanStories.sortBy')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t('artisanStories.sortNewest')}</SelectItem>
                    <SelectItem value="oldest">{t('artisanStories.sortOldest')}</SelectItem>
                    <SelectItem value="title_az">{t('artisanStories.sortAZ')}</SelectItem>
                    <SelectItem value="title_za">{t('artisanStories.sortZA')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error banner */}
      {fetchError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t('artisanStories.tableTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8">
              <div className="animate-pulse h-6 w-48 bg-gray-200 rounded mb-4" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 px-6 border-t">
                  <div className="h-14 w-14 bg-gray-200 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-gray-200 rounded" />
                    <div className="h-3 w-1/4 bg-gray-200 rounded" />
                  </div>
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-8 w-32 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center p-12">
              <p className="text-muted-foreground">{t('artisanStories.empty')}</p>
              <div className="mt-4">
                <Link to="/dashboard/stories/new">
                  <Button>{t('artisanStories.createFirst')}</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {visible.map((story) => (
                  <Card key={story._id} className="overflow-hidden">
                    <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                      {story.coverImageURL ? (
                        <img
                          src={story.coverImageURL}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ImageOff className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg line-clamp-2 mb-2">{story.title}</h3>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={String(story.status).toUpperCase() === 'PUBLISHED' ? 'default' : 'secondary'}>
                          {story.status === 'PUBLISHED' ? t('artisanStories.published') : t('artisanStories.draft')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(story.createdAt)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/stories/${story._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm" className="gap-1">
                            <ExternalLink className="h-4 w-4" />
                            {t('artisanStories.actions.view')}
                          </Button>
                        </a>
                        <Link to={`/dashboard/stories/edit/${story._id}`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Edit className="h-4 w-4" />
                            {t('artisanStories.actions.edit')}
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-destructive"
                              disabled={deletingId === story._id}
                            >
                              {deletingId === story._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              {t('artisanStories.actions.delete')}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('artisanStories.deleteTitle')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('artisanStories.deleteDesc', { title: story.title })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => handleDelete(story._id)}
                              >
                                {t('artisanStories.actions.delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {t('artisanStories.pagination', {
                    page: currentPage,
                    totalPages,
                    total: filteredSorted.length,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    {t('common.prev')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}