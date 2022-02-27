const puppeteer = require("puppeteer");
const fs = require("fs");
const axios = require("axios"); 

const wordToSearch = process.env['WORD_TO_SEARCH'];

async function downloadFile(url, path) {
	const response = await axios.get(url, { responseType: 'arraybuffer' });
	fs.writeFileSync(path, response.data);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--start-maximized", "--disable-setuid-sandbox"],
    defaultViewport: null,
  });
  const page = await browser.newPage();
  const URL = process.env["SCHOOL_URL"];
  const USERNAME = process.env["LOGIN_USERNAME"];
  const PASSWORD = process.env["LOGIN_PASSWORD"];

  page.goto(URL + "/login/login", {waitUntil: 'load', timeout: 0});

	page.setDefaultNavigationTimeout(80000)
	
  await page.waitFor('input[type="text"]'); // Makes sure the form was loaded
  await page.type("#username", USERNAME, { delay: 100 }); // Types slower, like a user

  await page.waitFor('input[type="password"]'); // Makes sure the form was loaded
  await page.type("#password", PASSWORD, { delay: 100 }); // Types slower, like a user

  // Captcha
  const captchaTextEl = await page.waitForSelector(".label-input100"); // select the element
  const captchaText = await captchaTextEl.evaluate((el) => el.textContent); // grab the textContent from the element, by evaluating this function in the browser context

  const captchaResult = eval(captchaText.split("=")[0]).toString();
  console.log("Recapthca Result: ", captchaResult);

  await page.type("#captcha", captchaResult, { delay: 500 }); // Types slower, like a user
  await page.waitFor("#login-btn"); // Makes sure the form was loaded
  await page.click("#login-btn");

  console.log("Logged In To ENTRAR!");

  await page.waitFor('.page-wrapper')

  page.goto(URL + "/pp_assignment/classassignment", {waitUntil: 'load', timeout: 0});

	
  await page.waitFor('#accordion'); // Makes sure the form was loaded
	
  const accordion = await page.waitForSelector("#accordion");
	const pdfs = await accordion.evaluate(() => [...document.querySelectorAll('tbody tr')].map(tr => {return {text: tr.children[2].textContent, url: tr.children[5].querySelector('a') && tr.children[5].querySelector('a').href}}));

	const filterdPdfs = pdfs.filter(tr => tr.text.toLowerCase().match(wordToSearch.toLowerCase()))
	var filteredPdfUrls = []
	
	filterdPdfs.forEach((pdf, i) => {
		console.log(pdf.url)
		if (pdf.url) {
			filteredPdfUrls.push(pdf.url)
		}
	})

// 	filteredPdfUrls.forEach(async (downloadUrl, i) => {
// const responseHandler = async (response) => {
//   const buffer = await response.buffer()
//   console.log(buffer)
//   fs.writeFileSync(`./pdfs/pdf-${i}.pdf`, buffer);
// }
// page.on('response', responseHandler)
// page.goto(downloadUrl)
// 			await downloadPage.waitFor(2*1000)

// 	})

		filteredPdfUrls.forEach(async (downloadUrl, i) => {
			var downloadPath = downloadUrl.split('/')
			downloadPath = downloadPath[downloadPath.length - 1]
			downloadPath = downloadPath.split('.pdf')[0] + '.pdf'
			downloadPath = __dirname + '/pdfs/' + downloadPath
			await downloadFile(downloadUrl, downloadPath)
			const downloadPage = await browser.newPage()
			downloadPage.goto('file://' + downloadPath)
			await downloadPage.waitFor(2*1000)
		})


	
  // More commands here...
  /* You may view the docs at:
       https://devdocs.io/puppeteer/
     And more magic at:
       https://www.npmjs.com/package/puppeteer
     Github:
       https://github.com/puppeteer/puppeteer
  */

  // await browser.close();
})();
