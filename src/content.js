import cheerio from 'cheerio';
import axios from 'axios';


const getData = (html) => {
  const $ = cheerio.load(html);
  const imageLinks = [];
  $('img').each((i, link) => imageLinks.push(($(link).attr('src'))));
  const images = $('img[src]');
  images.attr('src', (i, src) => {
    src.split('/')
    src.replace(/.*/, 'okok'));

  return {
    imageLinks,
    html: $.html(),
  };
};

const getDataByUrl = (url) => {
  return new Promise((resolve, reject) => {
    axios.get(url)
      .then((res) => {
        const { imageLinks } = getData(res.data);
        

      })
  })
}

// var inputs = $('input[id]');

// inputs.attr('id', function(i, id){
//     return id.replace('foo', 'foobar')


const html = `<!DOCTYPE html>
<html lang="ru">
    <head>
        <meta charset="utf-8">
        <title>Курсы по программированию Хекслет</title>
    </head>
    <body>
        <img src="/assets/professions/nodejs.png" alt="Иконка профессии Node.js-программист" />
        <h3>
            <a href="/professions/nodejs">Node.js-программист</a>
        </h3>
        <h3>
            <a href="/projects/first">Node.js-программист</a>
        </h3>
    </body>
</html>`;


console.log(getData(html));
// console.log(.map((el) => $(el).attr('href')));


// function fetchDataMercadoLivreByUrl(url) {
//   return new Promise((resolve, reject) => {
//     request(url, (err, res, body) => {
//       if (err) return reject(err);
//       try {
//         let $ = cheerio.load(body);
//         let product = {};
//         product.title = $('.item-title__primary').text().trim();
//         product.category = $('.vip-navigation-breadcrumb-list').children().first().text().trim();
//         product.brand = $('.specs-item.specs-item-primary')
//           .filter((i, el) => $(el).text().trim().startsWith('Marca'))
//           .map((i, el) => $(el).find('span').text()).toArray()[0] || '';


//         try {
//           product.freeShiping = $('.shipping-method-title > span').attr('class').trim() === 'green';
//         } catch (e) {
//         }
//         product.full = $('.shipment-methods div.full-icon svg').length == 1;
//         product.pictureUrl = $('.gallery__thumbnail img').first().attr('src');
//         product.url = url;

//         try {
//           product.sales = parseInt($('.item-conditions').text().match(/\d+/)[0]);
//         } catch {
//           product.sales = 0;
//         }

//         product.stock = parseInt($('.dropdown-quantity-available').text().replace(/[^\d]/g, ''));
//         product.price = parseFloat($('.price-tag:not(.price-tag__del)').children().first().attr('content'));
//         product.reviewCount = parseInt($('.average-legend span:first-child').text().trim());
//         emptyStarCount = $('div.layout-description-wrapper span.star-container input[id^="reviewEmptyStar"]').length;
//         halfStarCount = $('div.layout-description-wrapper span.star-container input[id^="reviewHalfStar"]').length;
//         product.reviewRating = 5 - emptyStarCount - halfStarCount / 2;
//         product.timestamp = Date.now();
//         resolve(product);
//       } catch (e) {
//         reject(e);
//       }
//     })
//   })
// }