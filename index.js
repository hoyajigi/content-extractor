// import { Readability } from '@mozilla/readability';
// import endent from 'endent';

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const Readability = require("@mozilla/readability").Readability;
const express = require("express");
const app = express();
const PORT = 3000;

cleanSourceText = (text) => {
  return text
    .trim()
    .replace(/(\n){4,}/g, '\n\n\n')
    .replace(/\n\n/g, ' ')
    .replace(/ {3,}/g, '  ')
    .replace(/\t/g, '')
    .replace(/\n+(\s*\n)*/g, '\n');
};

// 라우팅 정의
app.get("/", async (req, res1) => {
  let source = req.query.url;
  try {
    let driver1 = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(new chrome.Options().headless().addArguments("--disable-gpu", "window-size=1920x1080",
        "lang=ko_KR", "--user-agent=Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"))
      .build();

    try {
      // 특정 URL 생성
      await driver1.get(source);

      driver1.getPageSource().then(function (html) {
        const virtualConsole = new jsdom.VirtualConsole();
        virtualConsole.on('error', (error) => {
          if (!error.message.includes('Could not parse CSS stylesheet')) {
            console.error(error);
          }
        });

        const dom = new JSDOM(html, {
          virtualConsole, url: source
          , runScripts: "dangerously"
          , pretendToBeVisual: true
          , resources: "usable"
        });
        const doc = dom.window.document;
        let parsed = new Readability(doc).parse();

        if (parsed) {
          let sourceText = cleanSourceText(parsed.textContent);
          res1.status(200).send(sourceText);
        }
        else {
          // 400 Bad Request
          res1.status(400).send("Bad Request(1)");
        }
      });
    }
    catch (e) {
      console.log(e);
    }
    finally {
      driver1.quit();
    }
  } catch (error) {
    console.log(error)
    res1.status(400).send("Bad Request(2)");
  }
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Listen : ${PORT}`);
});