const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error));
  
  await page.goto('http://localhost:3000/');
  
  // Set local storage to simulate logged-in user
  await page.evaluate(() => {
    localStorage.setItem('infrapulse_user_session', JSON.stringify({
      id: 'user_nodal_1',
      role: 'nodal',
      name: 'Nodal Officer 1',
      pinnedProjects: []
    }));
  });
  
  await page.reload();
  await page.waitForTimeout(2000);
  
  const content = await page.content();
  if (content.includes('Establishing Secure Uplink') || content.includes('Dashboard')) {
    console.log("SUCCESS: Page rendered correctly!");
  } else {
    console.log("FAIL: Page content is blank or incorrect.");
  }
  
  await browser.close();
})();
