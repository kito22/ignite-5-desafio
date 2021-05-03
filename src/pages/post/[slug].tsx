import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  estimated_read_time: number;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

interface ContentProps {
  heading: string;
  body: {
    text: string;
  }[];
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const estimatedTimeToRead = useMemo(() => {
    if (post?.data?.content) {
      const words = post.data.content.reduce(
        (acc: number, item: ContentProps) => {
          Object.keys(item).forEach(innerItem => {
            if (innerItem === 'heading') {
              acc = Number(acc) + Number(item[innerItem].split(' ').length);
            } else if (item[innerItem]) {
              const body = RichText.asText(item[innerItem]);
              acc = Number(acc) + Number(body.split(' ').length);
            }
          });
          return Number(acc);
        },
        0
      );

      return Math.ceil(words / 200);
    }
    return '';
  }, [post]);

  return (
    <>
      {router.isFallback ? (
        <div>Carregando...</div>
      ) : (
        <>
          <Header />
          <div className={styles.container}>
            <img src={post.data.banner.url} alt="banner" />
            <main className={styles.content}>
              <header className={styles.header}>
                <h1>{post.data.title}</h1>
                <div className={styles.postInfo}>
                  <div>
                    <FiCalendar color="#bbbbbb" />
                    <time>
                      {post.first_publication_date &&
                        format(
                          new Date(post.first_publication_date),
                          'dd MMM yyyy',
                          {
                            locale: ptBR,
                          }
                        )}
                    </time>
                  </div>
                  <div>
                    <FiUser color="#bbbbbb" />
                    <span>{post.data.author}</span>
                  </div>
                  <div>
                    <FiClock color="#bbbbbb" />
                    <span>{estimatedTimeToRead} min</span>
                  </div>
                </div>
              </header>

              {post?.data?.content?.map(item => (
                <section key={item.heading}>
                  <h2>{item.heading}</h2>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(item.body),
                    }}
                  />
                </section>
              ))}
            </main>
          </div>
        </>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'post')
  );

  const formattedPaths = postsResponse.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths: formattedPaths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const postResponse = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: postResponse.uid,
    first_publication_date: postResponse.first_publication_date,
    data: {
      title: postResponse.data.title,
      author: postResponse.data.author,
      subtitle: postResponse.data.subtitle,
      banner: {
        url: postResponse.data.banner.url,
      },
      content: postResponse.data.content,
    },
  };
  return {
    props: {
      post,
    },
  };
};
