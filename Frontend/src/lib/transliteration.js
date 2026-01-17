export async function transliterateToHindi(text) {
  try {
    const res = await fetch(
      `https://inputtools.google.com/request?text=${encodeURIComponent(
        text
      )}&itc=hi-t-i0-und&num=1`
    );

    const data = await res.json();

    if (data[0] === "SUCCESS") {
      return data[1][0][1][0];
    }

    return text;
  } catch (err) {
    console.error("Transliteration error:", err);
    return text;
  }
}