// scripts/generate-lists.js
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import slugify from 'slugify';

const POSTS_DIR = path.join(process.cwd(), 'src', 'content', 'posts');
const OUT_DIR = path.join(process.cwd(), 'src', 'data');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function readPosts() {
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const posts = files.map((file) => {
    const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { data, excerpt } = matter(content, { excerpt: true });
    const filename = path.basename(file, '.md');
    // If frontmatter doesn't include slug, create one
    const slug = data.slug || slugify(filename, { lower: true });
    if (!data.date) {
      throw new Error(`Post ${file} is missing a date in frontmatter.`);
    }
    return {
      title: data.title || 'Untitled',
      date: new Date(data.date).toISOString(),
      excerpt: data.excerpt || excerpt || '',
      slug,
      draft: !!data.draft,
      heroImage: data.heroImage || '',
    };
  });
  return posts.filter(p => !p.draft);
}

function writeJson(filename, obj) {
  fs.writeFileSync(path.join(OUT_DIR, filename), JSON.stringify(obj, null, 2));
}

try {
  const posts = readPosts();
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  const RECENT_LIMIT = 9;

  const recent = posts.slice(0, RECENT_LIMIT);
  const archive = posts.slice(RECENT_LIMIT);

  writeJson('recent.json', recent);
  writeJson('archive.json', archive);

  console.log(`Wrote ${recent.length} recent posts and ${archive.length} archive posts to src/data`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
