import playwright from 'playwright';

const rulesUrl = `https://fabtcg.com/resources/rules-and-policy-center/comprehensive-rules/`;

export async function Download(destination: string) {

  // Use playwright to download the pdf.
  const browser = await playwright.firefox.launch({headless: true});
  const page = await browser.newPage();
  await page.goto(rulesUrl);
  const locator = page.locator('div.listblock-item:nth-child(1)>a');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    locator.click(),
  ]);

  // Save the file locally
  await download.saveAs(destination);

  // Close playwright
  await browser.close();
}