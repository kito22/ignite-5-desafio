import { GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import { useState } from 'react';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);
  // const [showLoadMoreButton, setShowLoadMoreButton] = useState(false);

  async function loadMorePosts(): Promise<void> {
    const response = await fetch(postsPagination.next_page);
    const apiResponse: ApiSearchResponse = await response.json();

    const formattedPosts = apiResponse.results.map(post => ({
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
      data: {
        title: post.data.title,
        author: post.data.author,
        subtitle: post.data.subtitle,
      },
    }));
    setPosts([...posts, ...formattedPosts]);
    setNextPage(apiResponse.next_page);
  }

  return (
    <>
      <Head>
        <title>Space Traveling | Home</title>
      </Head>
      <Header />

      <main className={`${commonStyles.container} ${styles.container}`}>
        {posts.map(post => (
          <div key={post.uid} className={styles.post}>
            <Link href={`/post/${post.uid}`}>{post.data.title}</Link>
            <p>{post.data.subtitle}</p>
            <div className={styles.postFooter}>
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
            </div>
          </div>
        ))}
        {nextPage && (
          <button onClick={loadMorePosts} type="button">
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'post'),
    {
      pageSize: 1,
    }
  );
  const formattedPosts = postsResponse.results.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      author: post.data.author,
      subtitle: post.data.subtitle,
    },
  }));

  return {
    props: {
      postsPagination: {
        results: formattedPosts,
        next_page: postsResponse.next_page,
      },
    },
  };
};
