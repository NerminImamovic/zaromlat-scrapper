const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");
const cheerio = require('cheerio');

module.exports.hello = async (event) => {
  const requestBody = JSON.parse(event.body);
  const { url } = requestBody;

  console.log('URL ' + url);

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
  await page.goto(url);

  const content = await page.content();

  console.log('content ' + JSON.stringify(content))

  const $ = cheerio.load(content);
  let full;
  let obj;

  $('script').each((index, elem) => {
    const scr = $(elem).text();

    if (scr?.trim().startsWith('wi')) {
      console.log('aaa' + scr);
      if (scr.split('window.zara.viewPayload = ')[1]) {
        full = scr.split('window.zara.viewPayload = ')[1].trim().slice(0, -1);

        obj = JSON.parse(full);
      }
    }
  });

  console.log('obj   ' + JSON.stringify(obj));

  const articles = obj.product.detail.colors.map(color => ({
    hexCode: color.hexCode,
    name: color.name,
    sizes: color.sizes.filter(size => size.availability === 'in_stock').map(size => ({
      name: size.name,
      price: size.price,
    })),
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({
      articles,
    }),
  };
};
