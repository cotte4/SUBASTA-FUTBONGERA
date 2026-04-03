import fs from 'node:fs/promises';
import path from 'node:path';
import { allPlayers } from '../src/data/players';

const OUTPUT_DIR = path.resolve('public/players');
const USER_AGENT = 'subasta-futbolera-image-fetcher/1.0';

const titleOverrides: Record<string, string[]> = {
  'br-ederson': ['Ederson (footballer, born 1993)'],
  'pt-vitinha': ['Vitinha (footballer, born 2000)'],
  'pt-jota': ['Diogo Jota'],
  'br-savinho': ['Sávio Moreira de Oliveira'],
  'de-kimmich-rb': ['Joshua Kimmich'],
  'br-danilo-rb': ['Danilo (footballer, born July 1991)'],
  'es-simon': ['Unai Simón'],
  'pt-sa': ['José Sá'],
  'be-duku': ['Jérémy Doku'],
  'hr-kramaric': ['Andrej Kramarić'],
  'fr-kante': ['N\'Golo Kanté'],
  'de-fuellkrug': ['Niclas Füllkrug'],
  'uy-araujo': ['Ronald Araújo'],
  'uy-vina': ['Matías Viña'],
  'uy-gimenez': ['José María Giménez'],
  'pt-joao-neves': ['João Neves'],
  'pt-conceicao': ['Francisco Conceição'],
  'br-guimaraes': ['Bruno Guimarães'],
  'br-paqueta': ['Lucas Paquetá'],
  'hr-brozovic': ['Marcelo Brozović'],
  'fr-zaire-emery': ['Warren Zaïre-Emery'],
  'pt-inacio': ['Gonçalo Inácio'],
};

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  let success = 0;
  let skipped = 0;
  let failed = 0;
  const misses: string[] = [];

  for (const player of allPlayers) {
    const targetPath = path.join(OUTPUT_DIR, `${player.id}.jpg`);

    try {
      await fs.access(targetPath);
      skipped += 1;
      continue;
    } catch {
      // missing file, continue
    }

    const candidates = [
      ...(titleOverrides[player.id] ?? []),
      player.name,
      `${player.name} footballer`,
      `${player.name} ${player.country} footballer`,
    ];

    const imageUrl = await resolveImageUrl(candidates);
    if (!imageUrl) {
      failed += 1;
      misses.push(`${player.id} :: ${player.name}`);
      continue;
    }

    const response = await fetchWithRetry(imageUrl);
    if (!response.ok) {
      failed += 1;
      misses.push(`${player.id} :: HTTP ${response.status}`);
      continue;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(targetPath, buffer);
    success += 1;
  }

  console.log(JSON.stringify({ success, skipped, failed, total: allPlayers.length }, null, 2));
  if (misses.length) {
    await fs.writeFile(path.resolve('image-fetch-misses.txt'), `${misses.join('\n')}\n`);
  }
}

async function resolveImageUrl(candidates: string[]) {
  for (const candidate of candidates) {
    const direct = await fetchThumbForTitle(candidate);
    if (direct) {
      return direct;
    }

    const searchResults = await searchTitles(candidate);
    for (const title of searchResults) {
      const result = await fetchThumbForTitle(title);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

async function searchTitles(query: string) {
  const url = new URL('https://en.wikipedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('list', 'search');
  url.searchParams.set('srsearch', query);
  url.searchParams.set('srlimit', '5');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');

  const response = await fetchWithRetry(url);
  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    query?: { search?: Array<{ title: string }> };
  };
  return data.query?.search?.map((entry) => entry.title) ?? [];
}

async function fetchThumbForTitle(title: string) {
  const url = new URL('https://en.wikipedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('prop', 'pageimages');
  url.searchParams.set('pithumbsize', '600');
  url.searchParams.set('titles', title);
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');

  const response = await fetchWithRetry(url);
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          thumbnail?: { source?: string };
        }
      >;
    };
  };

  const pages = data.query?.pages ?? {};
  for (const page of Object.values(pages)) {
    if (page.thumbnail?.source) {
      return page.thumbnail.source;
    }
  }

  return null;
}

async function fetchWithRetry(url: URL | string, attempt = 0): Promise<Response> {
  await sleep(120);

  const response = await fetch(url, {
    headers: { 'user-agent': USER_AGENT },
  });

  if (response.status === 429 && attempt < 4) {
    await sleep(600 * (attempt + 1));
    return fetchWithRetry(url, attempt + 1);
  }

  return response;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

void main();
