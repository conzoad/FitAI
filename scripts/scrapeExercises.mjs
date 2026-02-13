/**
 * Scraper for fitnessprogramer.com exercises
 * Extracts exercise data and GIF URLs by muscle group
 * 
 * Usage: node scripts/scrapeExercises.mjs
 */
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

const MUSCLE_GROUPS = [
    { url: 'https://fitnessprogramer.com/muscles/chest-muscles/', group: 'chest', label: 'Грудь' },
    { url: 'https://fitnessprogramer.com/muscles/back-muscles/', group: 'back', label: 'Спина' },
    { url: 'https://fitnessprogramer.com/muscles/shoulder-muscles/', group: 'shoulders', label: 'Плечи' },
    { url: 'https://fitnessprogramer.com/muscles/biceps/', group: 'biceps', label: 'Бицепс' },
    { url: 'https://fitnessprogramer.com/muscles/triceps/', group: 'triceps', label: 'Трицепс' },
    { url: 'https://fitnessprogramer.com/muscles/leg-muscles/', group: 'legs', label: 'Ноги' },
    { url: 'https://fitnessprogramer.com/muscles/glutes/', group: 'glutes', label: 'Ягодицы' },
    { url: 'https://fitnessprogramer.com/muscles/abdominal-muscles/', group: 'abs', label: 'Пресс' },
    { url: 'https://fitnessprogramer.com/muscles/forearm-muscles/', group: 'forearms', label: 'Предплечья' },
    { url: 'https://fitnessprogramer.com/muscles/calves-muscles/', group: 'calves', label: 'Икры' },
];

// Equipment mapping (English -> Russian)
const EQUIPMENT_MAP = {
    'barbell': 'Штанга',
    'dumbbell': 'Гантели',
    'dumbbells': 'Гантели',
    'cable': 'Тросовый тренажёр',
    'machine': 'Тренажёр',
    'smith machine': 'Смит-машина',
    'bodyweight': 'Собственный вес',
    'body weight': 'Собственный вес',
    'resistance band': 'Резиновая лента',
    'band': 'Лента',
    'kettlebell': 'Гиря',
    'ez bar': 'EZ-гриф',
    'ez-bar': 'EZ-гриф',
    'pull-up bar': 'Турник',
    'bench': 'Скамья',
    'stability ball': 'Фитбол',
    'medicine ball': 'Медбол',
    'trx': 'TRX',
    'foam roller': 'Ролик',
    'plate': 'Блин',
};

function slugify(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function detectEquipment(name, description) {
    const text = (name + ' ' + (description || '')).toLowerCase();
    for (const [key, value] of Object.entries(EQUIPMENT_MAP)) {
        if (text.includes(key)) return value;
    }
    if (text.includes('push-up') || text.includes('pushup') || text.includes('plank') ||
        text.includes('crunch') || text.includes('sit-up') || text.includes('burpee') ||
        text.includes('mountain climber') || text.includes('lunge') && !text.includes('dumbbell') && !text.includes('barbell')) {
        return 'Собственный вес';
    }
    return 'Тренажёр';
}

function isCompoundExercise(name) {
    const compoundKeywords = [
        'press', 'squat', 'deadlift', 'row', 'pull-up', 'pullup', 'chin-up',
        'dip', 'lunge', 'thrust', 'clean', 'snatch', 'push-up', 'pushup',
        'burpee', 'step-up', 'thrusters',
    ];
    const lowerName = name.toLowerCase();
    return compoundKeywords.some(kw => lowerName.includes(kw));
}

async function scrapeExerciseListPage(page, url) {
    console.log(`  Scraping: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const exercises = await page.evaluate(() => {
        const results = [];
        // Look for exercise cards/links on the page
        const exerciseLinks = document.querySelectorAll('a[href*="/exercise/"]');
        const seen = new Set();

        exerciseLinks.forEach(link => {
            const href = link.href;
            if (!href || seen.has(href)) return;

            // Skip nav/menu links
            if (link.closest('nav') || link.closest('header') || link.closest('footer')) return;

            seen.add(href);

            // Try to get exercise name from the link
            const name = link.textContent?.trim() ||
                link.querySelector('h2, h3, .title')?.textContent?.trim() || '';

            // Try to get GIF URL from img inside or nearby
            const img = link.querySelector('img') ||
                link.parentElement?.querySelector('img');
            const gifUrl = img?.src || img?.getAttribute('data-src') || img?.getAttribute('data-lazy-src') || '';

            if (name && name !== 'View Details' && name.length > 2) {
                results.push({
                    name,
                    url: href,
                    gifUrl,
                });
            }
        });

        return results;
    });

    return exercises;
}

async function scrapeExerciseDetail(page, exerciseUrl) {
    try {
        await page.goto(exerciseUrl, { waitUntil: 'networkidle2', timeout: 20000 });
        await new Promise(r => setTimeout(r, 1500));

        const detail = await page.evaluate(() => {
            // Get description
            const descEl = document.querySelector('.entry-content p, article p, .exercise-description');
            const description = descEl?.textContent?.trim()?.slice(0, 200) || '';

            // Get GIF URL 
            const gifImg = document.querySelector('img[src*=".gif"], img[data-src*=".gif"]');
            const gifUrl = gifImg?.src || gifImg?.getAttribute('data-src') || '';

            // Get equipment info
            const metaEls = document.querySelectorAll('.exercise-meta span, .exercise-info span, td, .entry-content li');
            let equipment = '';
            metaEls.forEach(el => {
                const text = el.textContent?.toLowerCase() || '';
                if (text.includes('equipment') || text.includes('type')) {
                    equipment = el.textContent?.replace(/equipment:?/i, '')?.trim() || '';
                }
            });

            // Get target muscles
            const muscleEls = document.querySelectorAll('.exercise-meta a[href*="muscles"], .target-muscle');
            const muscles = Array.from(muscleEls).map(el => el.textContent?.trim()).filter(Boolean);

            return { description, gifUrl, equipment, muscles };
        });

        return detail;
    } catch (err) {
        console.error(`    Error scraping ${exerciseUrl}: ${err.message}`);
        return null;
    }
}

async function getNextPageUrl(page) {
    return page.evaluate(() => {
        const nextLink = document.querySelector('a.next, a[rel="next"], .pagination a:last-child');
        if (nextLink && nextLink.textContent?.includes('Next') || nextLink?.textContent?.includes('»')) {
            return nextLink.href;
        }
        // Try numbered pagination
        const current = document.querySelector('.current, .page-numbers.current');
        if (current) {
            const next = current.nextElementSibling;
            if (next?.tagName === 'A') return next.href;
        }
        return null;
    });
}

async function scrapeAllExercisesFromList(page) {
    // Scrape from the main exercises paginated list
    let allExercises = [];
    let currentPage = 1;
    const MAX_PAGES = 85;

    let url = 'https://fitnessprogramer.com/exercises/';

    while (url && currentPage <= MAX_PAGES) {
        console.log(`\n📄 Page ${currentPage}: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        const exercises = await page.evaluate(() => {
            const results = [];
            // Target the main exercise grid items
            const cards = document.querySelectorAll('.jejeExBlock, article, .exercise-card, .post, .wp-block-post');

            if (cards.length > 0) {
                cards.forEach(card => {
                    const link = card.querySelector('a[href*="/exercise/"]');
                    if (!link) return;

                    const href = link.href;
                    const name = card.querySelector('h2, h3, .title, .exercise-name')?.textContent?.trim() ||
                        link.textContent?.trim() || '';

                    const img = card.querySelector('img');
                    const gifUrl = img?.src || img?.getAttribute('data-src') || img?.getAttribute('data-lazy-src') || '';

                    if (name && name !== 'View Details' && name.length > 2) {
                        results.push({ name, url: href, gifUrl });
                    }
                });
            }

            if (results.length === 0) {
                // Fallback: look for any exercise links
                const links = document.querySelectorAll('a[href*="/exercise/"]');
                const seen = new Set();
                links.forEach(link => {
                    const href = link.href;
                    if (!href || seen.has(href) || link.closest('nav,header,footer')) return;
                    seen.add(href);
                    const name = link.textContent?.trim();
                    const img = link.querySelector('img') || link.closest('div')?.querySelector('img');
                    const gifUrl = img?.src || img?.getAttribute('data-src') || '';
                    if (name && name !== 'View Details' && name.length > 2) {
                        results.push({ name, url: href, gifUrl });
                    }
                });
            }

            // Check for next page
            const nextPageEl = document.querySelector('a.next.page-numbers, a.page-numbers:not(.current):last-of-type');
            const nextPage = nextPageEl?.href || null;

            return { exercises: results, nextPage };
        });

        allExercises = allExercises.concat(exercises.exercises);
        console.log(`   Found ${exercises.exercises.length} exercises (total: ${allExercises.length})`);

        url = exercises.nextPage;
        currentPage++;

        // Rate limiting
        await new Promise(r => setTimeout(r, 1000));
    }

    return allExercises;
}

async function enrichWithDetails(page, exercises, batchSize = 5) {
    console.log(`\n🔍 Enriching ${exercises.length} exercises with detail pages...`);

    for (let i = 0; i < exercises.length; i += batchSize) {
        const batch = exercises.slice(i, i + batchSize);

        for (const exercise of batch) {
            if (!exercise.url) continue;

            console.log(`  [${i + batch.indexOf(exercise) + 1}/${exercises.length}] ${exercise.name}`);
            const detail = await scrapeExerciseDetail(page, exercise.url);

            if (detail) {
                if (!exercise.gifUrl && detail.gifUrl) exercise.gifUrl = detail.gifUrl;
                if (detail.description) exercise.description = detail.description;
                if (detail.equipment) exercise.equipmentRaw = detail.equipment;
                if (detail.muscles?.length) exercise.muscles = detail.muscles;
            }

            // Rate limiting
            await new Promise(r => setTimeout(r, 800));
        }
    }
}

function buildExerciseDatabase(exercises) {
    const seen = new Set();
    const unique = exercises.filter(ex => {
        const key = ex.url || ex.name;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return unique.map(ex => ({
        id: slugify(ex.name),
        name: ex.name,
        muscleGroup: ex.muscleGroup || 'fullBody',
        equipment: detectEquipment(ex.name, ex.description || ''),
        description: ex.description || '',
        isCompound: isCompoundExercise(ex.name),
        gifUrl: ex.gifUrl || '',
    }));
}

async function main() {
    console.log('🚀 Starting fitnessprogramer.com scraper...\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Step 1: Scrape all exercises from paginated list
    let allExercises = await scrapeAllExercisesFromList(page);

    console.log(`\n✅ Total exercises found: ${allExercises.length}`);

    // Step 2: Determine muscle groups from exercise detail pages
    // We'll do this for a subset first (top exercises)
    console.log('\n🏋️ Enriching exercises with details...');
    await enrichWithDetails(page, allExercises);

    // Step 3: Save raw data as JSON
    const outputPath = path.join(process.cwd(), 'scripts', 'exercises_raw.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(allExercises, null, 2));
    console.log(`\n💾 Raw data saved to ${outputPath}`);

    // Step 4: Build the exercise database
    const database = buildExerciseDatabase(allExercises);
    const dbPath = path.join(process.cwd(), 'scripts', 'exercises_database.json');
    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
    console.log(`📦 Database saved to ${dbPath} (${database.length} exercises)`);

    await browser.close();
    console.log('\n🎉 Done!');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
