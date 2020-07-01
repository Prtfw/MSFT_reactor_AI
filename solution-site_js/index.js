// load env var
require('dotenv').config({path: '../.env'})

// Init express
const express = require('express'),
path = require('path');

// Multer to process upload image
const multer  = require('multer');

// Filesystem module
const fs = require('fs');

// Add request
const request = require('request');

// Initialize app with express
const app = express();

// Middleware to extract data from form
app.use(express.urlencoded())

// Server run on port number on environment or port
const PORT = process.env.PORT || 5000;

// Run the webserver by listening to the port
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// Directory of html
const html_dir = './templates/';

app.use(express.static('./templates'));

app.use(express.static('./public'));


// Set storage engine Multer
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
    cb(null, file.fieldname + '-' + Date.now() +
    path.extname(file.originalname));
  }
});

// Init upload Multer
const upload = multer({
  storage: storage
}).single('myImage')


//* load env vars ---------------------------------------------------------------------------------


const api_key = process.env._key

const translate_key = process.env.translate_key

const _sentiment_key = process.env._sentiment_key

const _base_url = process.env.base_url

const _sentiment_url = process.env._sentiment_url

COGSVCS_CLIENTURL = _base_url
COGSVCS_KEY = api_key


/*API**********************************************************************************************/

// Function POST API
const fetch = require("node-fetch");

// OCR API
const text_recognition_url = _base_url + '/vision/v3.0/read/analyze'

// Cognitive API for Translator Text
const translator_text_url = 'https://api.cognitive.microsofttranslator.com/' + '/translate?api-version=3.0'

// Translation API
let translation_endpoint = 'https://api.cognitive.microsofttranslator.com/'

// General headers for API
const headers = {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key' : api_key
  }


/*TRANSLATION**********************************************************************************************/

let web_url = '/static/placeholder.png'

let image_file = '/static/placeholder.png'

let target_language_dictionary = [
    {key: "English", value: 'en'},
    {key: "Chinese (simplified)", value: 'zh-Hans'},
    {key: "Chinese (traditional)", value: 'zh-Hant'},
    {key: "French", value: 'fr'},
    {key: "German", value: 'de'},
    {key: "Italian", value: 'it'},
    {key: "Japanese", value: 'ja'},
    {key: "Korean", value: 'ko'},
    {key: "Portugese", value: 'pt'},
    {key: "Spanish", value: 'es'},
];


/*EJS**********************************************************************************************/

// To use extend in html, npm i express-ejs-extend
app.engine('ejs', require('express-ejs-extend'));

// Set ejs
app.set('view engine', 'ejs');

// Join paths with 'views'
app.set('views', path.join(__dirname, 'views'));

app.get('/', function (req, res) {
 res.render('index');
});


app.get('/translate_upload', function (req, res) {

  res.render('translate_upload', {target_language_dictionary: target_language_dictionary, result: '', image_file: image_file});
  console.log("GET TRANSLATE UPLOAD IMAGE")
 });

app.get('/translate_url', function (req, res) {

 res.render('translate_url', {target_language_dictionary: target_language_dictionary, result: '', web_url: web_url});
 console.log("GET TRANSLATE URL")
});



/*POST**********************************************************************************************/


/*TRANSLATION UPLOAD IMAGE**********************************************************************************************/

// Translation from uploaded picture
app.post('/translate_upload', upload, async (req, res) => {

  let target_language = req.body.target_language

  // Path to uploaded image
  let image_path = req.file.path


  // Process image to binary
  const base64 =  fs.readFileSync(image_path, 'base64')
  const data = Buffer.from(base64, 'base64')

  // Headers
  const headers = {
    'Content-Type': 'application/octet-stream',
    'Ocp-Apim-Subscription-Key' : api_key
  }

 const process_text = async (endpoint, data) => {

  const response = await fetch(endpoint, {
    method: 'POST',
    params: {
      "visualFeatures": "Categories,Description,Color",
      "details": "",
      "language": "en",
  },
    headers: headers,
    body: data
  }),

  response_headers = response.headers.get(('Operation-Location'), headers)

  result = process_text_final_response(response_headers)

  return result

}

const process_text_final_response = async (response_headers) => {

  result = {}

  while (true){

    const response2 = await fetch(response_headers,{
      method: 'GET',
      headers: headers,
      location: 'Operation-Location'
    })

  result = await response2.json()

  if ('analyzeResult' in result){
    break
    }

  if('status' in result && result.status == 'failed'){

    break
    }
 }

    result = result.analyzeResult.readResults[0].lines
    let word_list = []
    for(let i in result){
      words = result[i].text
      words = words.toLowerCase()
      word_list.push(words)
    }
    word_list = word_list.join(' ')
    word_list = JSON.stringify(word_list)

    console.log(116, "RETURN RESULT: ", word_list)

    return word_list

}

    let word_list = await process_text(text_recognition_url, data, headers)
    console.log("RESP,", word_list)

    const _params= {
    'api-version': '3.0',
    'to': [target_language]
          }

    var URL = require('url').URL;
    var url = new URL(translator_text_url)


    const {URLSearchParams} = require('url');
    url.search = new URLSearchParams(_params).toString();

    const response = await fetch(url, {
    method: 'POST',
    baseUrl: translation_endpoint,
    url: 'translate',
    params: {
      'api-version': '3.0',
      'to': [target_language]
    },
    headers: {
      'Ocp-Apim-Subscription-Key': translate_key,
      'Ocp-Apim-Subscription-Region': 'eastus',
      'Content-type': 'application/json',
      'X-ClientTraceId': '315abf80-187a-4df1-89d3-bcf7f15cac36'
    },
    body: JSON.stringify([{
          'text': word_list
    }])
    })

    // Translate result
    const translate_result = await response.json()

    // True or false for result
    let score = translate_result[0].detectedLanguage.score
    console.log("SCORE", translate_result[0].detectedLanguage.score)

    // Extract text with translated lines from translate_result
    translate_result_to_html = translate_result[0].translations[0].text
    console.log("TRANSLATE RESULT", translate_result[0].translations[0].text)

    if(score == 0){
      translate_result_to_html = "Could not find any text to translate in the picture. "
    }

       // Render to ejs page
    res.render('translate_upload', {
      target_language_dictionary: target_language_dictionary,
      result: translate_result_to_html,
      image_file: `uploads/${req.file.filename}`,
    });

});

/*TRANSLATE URL API**********************************************************************************************/

// Post translate_url, API call
app.post('/translate_url', async (req, res) => {

  let target_language = req.body.target_language
  console.log("TARGET LANGUAGE", target_language)

  web_url = req.body.web_url
  console.log("WEB URL: ", web_url)

  if(web_url == ''){
    web_url = '/static/placeholder.png'
    res.render('translate_url', {target_language_dictionary: target_language_dictionary, result: 'Please add an image URL in the input field',
    web_url: web_url});
  }

  else{
  // Extract text from images API (OCR)
  const process_text_API = async (endpoint, json, headers) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({'url': json})
    }),

    response_headers = response.headers.get(('Operation-Location'), headers)

    result = process_text_final_response(response_headers)
    return result
  }


  const process_text_final_response = async (response_headers) => {
    result = {}
    while (true){

      const response2 = await fetch(response_headers,{
        method: 'GET',
        headers: headers,
        location: 'Operation-Location'
      })

    result = await response2.json()

    if ('analyzeResult' in result){
      break}

    if('status' in result && result.status == 'failed'){
      break}}


    result = result.analyzeResult.readResults[0].lines
    let word_list = []
    for(let i in result){
      words = result[i].text
      words = words.toLowerCase()
      word_list.push(words)
    }
    word_list = word_list.join(' ')
    word_list = JSON.stringify(word_list)

    console.log(116, "RETURN RESULT: ", word_list)

    return word_list

  }

let word_list = await process_text_API(text_recognition_url, web_url, headers)
console.log("RESP,", word_list)


    // Translation API, Error: { error: { code: 400036, message: 'The target language is not valid.' } }
  const _params= {
    'api-version': '3.0',
    'to': [target_language]
      }

var URL = require('url').URL;
var url = new URL(translator_text_url)


const {URLSearchParams} = require('url');
url.search = new URLSearchParams(_params).toString();

const response = await fetch(url, {
method: 'POST',
baseUrl: translation_endpoint,
url: 'translate',
params: {
  'api-version': '3.0',
  'to': [target_language]
},
headers: {
  'Ocp-Apim-Subscription-Key': translate_key,
  'Ocp-Apim-Subscription-Region': 'eastus',
  'Content-type': 'application/json',
  'X-ClientTraceId': '315abf80-187a-4df1-89d3-bcf7f15cac36' // uuidv4().toString()
},
body: JSON.stringify([{
      'text': word_list
}])
})

// Translate result
const translate_result = await response.json()

// Extract text with translated lines from translate_result
translate_result_to_html = translate_result[0].translations[0].text
console.log("TRANSLATE RESULT", translate_result[0].translations[0].text)

// Render result of translation to translate_url_test
res.render('translate_url', {target_language_dictionary: target_language_dictionary, result: translate_result_to_html, web_url: web_url});

// End of else
}

});














