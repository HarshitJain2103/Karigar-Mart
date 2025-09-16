import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Plus, Loader2, Edit, Trash2, ExternalLink, RefreshCw, Search, Filter, ArrowUpDown, ImageOff } from 'lucide-react';

const API_BASE = 'http://localhost:8000';
const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function ArtisanStoryManager() {
  const token = useAuthStore((state) => state.token);

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // UI state
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | PUBLISHED | DRAFT
  const [sortBy, setSortBy] = useState('newest'); // newest | oldest | title_az | title_za
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
      const res = await fetch(`${API_BASE}/api/stories/my-stories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch stories.');
      const data = await res.json();
      setStories(Array.isArray(data) ? data : []);
    } catch (error) {
      setFetchError(error.message || 'Failed to fetch stories.');
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
      const res = await fetch(`${API_BASE}/api/stories/${storyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete story.');
      setStories((prev) => prev.filter((s) => s._id !== storyId));
    } catch (err) {
      setFetchError(err.message || 'Failed to delete story.');
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
          <h1 className="text-3xl font-bold">My Stories</h1>
          <p className="text-muted-foreground">Create and manage stories for your store.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={refreshing || loading}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Link to="/dashboard/stories/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Story
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
                placeholder="Search by title or ID..."
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
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
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
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="title_az">Title A–Z</SelectItem>
                    <SelectItem value="title_za">Title Z–A</SelectItem>
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
          <CardTitle className="text-lg">Stories</CardTitle>
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
              <p className="text-muted-foreground">You haven&apos;t written any stories yet.</p>
              <div className="mt-4">
                <Link to="/dashboard/stories/new">
                  <Button>Create your first story</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Story</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((story) => (
                    <TableRow key={story._id}>
                      <TableCell className="max-w-0">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 rounded-md overflow-hidden bg-gray-100 border">
                            {story.coverImageURL ? (
                              <img
                                src={story.coverImageURL}
                                alt={story.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                <ImageOff className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{story.title}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              ID: {story._id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={String(story.status).toUpperCase() === 'PUBLISHED' ? 'default' : 'secondary'}>
                          {String(story.status || '').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(story.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <a
                            href={`/stories/${story._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View story"
                          >
                            <Button variant="ghost" size="sm" className="gap-1">
                              <ExternalLink className="h-4 w-4" />
                              View
                            </Button>
                          </a>
                          <Link to={`/dashboard/stories/edit/${story._id}`}>
                            <Button variant="ghost" size="sm" className="gap-1">
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                          </Link>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-destructive"
                                disabled={deletingId === story._id}
                                title="Delete story"
                              >
                                {deletingId === story._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this story?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete “{story.title}”.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => handleDelete(story._id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} • {filteredSorted.length} total
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
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