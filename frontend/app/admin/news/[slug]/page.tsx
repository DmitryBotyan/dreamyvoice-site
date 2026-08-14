import Link from "next/link";
import { notFound } from "next/navigation";
import { getNewsPost } from "@/lib/server-api";
import { DeleteLink } from "../../delete-link";
import { NewsForm } from "../news-form";
import { deleteNewsPostAction, updateNewsPostAction } from "../actions";
import styles from "../../styles.module.css";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function AdminNewsEditPage({ params }: Props) {
  const { slug } = await params;
  const post = await getNewsPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <p className={styles.breadcrumb}>
        <Link href="/admin/news">Назад к новостям</Link>
      </p>

      <header className={styles.pageHeader}>
        <h1>{post.title}</h1>
        <p>
          {post.published ? "Опубликована" : "Черновик"} · {post.slug}
        </p>
      </header>

      <NewsForm
        action={updateNewsPostAction.bind(null, post.slug)}
        legend="Новость"
        submitLabel="Сохранить"
        successMessage="Изменения сохранены."
        initialValues={{
          title: post.title,
          excerpt: post.excerpt ?? "",
          body: post.body,
          coverKey: post.coverKey ?? null,
          coverBlurHash: post.coverBlurHash ?? null,
          published: post.published,
        }}
      />

      <div className={styles.pageActions}>
        {post.published ? (
          <Link className={styles.link} href={`/news/${post.slug}`}>
            Посмотреть на сайте
          </Link>
        ) : null}
        <DeleteLink
          action={deleteNewsPostAction}
          fields={[{ name: "slug", value: post.slug }]}
          formClassName={styles.deleteLinkForm}
          className={styles.linkDanger}
        >
          Удалить новость
        </DeleteLink>
      </div>
    </>
  );
}
