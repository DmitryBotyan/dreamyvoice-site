import { redirect, notFound } from "next/navigation";
import { ApiError, getRandomTitle } from "@/lib/server-api";

export default async function RandomTitlePage() {
  let randomTitle;

  try {
    randomTitle = await getRandomTitle();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  if (!randomTitle || !randomTitle.slug) {
    notFound();
  }

  redirect(`/titles/${encodeURIComponent(randomTitle.slug)}`);
}
