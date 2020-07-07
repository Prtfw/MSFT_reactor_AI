// load env var
require('dotenv').config({path: '.env'})

// Initialize app with express
const express = require('express'),
path = require('path');

const app = express();

// Multer to process upload image
const multer  = require('multer');

// Filesystem module
const fs = require('fs');

// Add request
const request = require('request');

// Middleware to extract data from form
app.use(express.urlencoded())

// Server run on port number on environment or port
const PORT = process.env.PORT || 5000;

// Run the webserver by listening to the port
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// Static files
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

// // Add your foundation url for  your azure account here
// const _base_url = 'https://yourazureaccount.cognitiveservices.azure.com/'

// const _sentiment_base_url = 'https://youraccount-text-analytics.cognitiveservices.azure.com/'

// // OCR API
// const text_recognition_url = _base_url + '/vision/v3.0/read/analyze'

// // Computer Vision API
// const analyze_endpoint = _base_url + '/vision/v3.0/analyze'

// // Cognitive API for Translator Text
// const translator_text_url = 'https://api.cognitive.microsofttranslator.com/' + '/translate?api-version=3.0'

// // Translation API
// let translation_endpoint = 'https://api.cognitive.microsofttranslator.com/'

// // Sentiment API
// const sentiment_url = _sentiment_base_url + '/text/analytics/v2.1/sentiment'

// Function POST API
const fetch = require("node-fetch");

// Headers for API call (image url)
const url_headers = {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key' : api_key
  }

 // Headers for API call (upload image)
 const upload_headers = {
  'Content-Type': 'application/octet-stream',
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

// To use extend in html
app.engine('ejs', require('express-ejs-extend'));

// Set ejs
app.set('view engine', 'ejs');

// Join paths with 'views'
app.set('views', path.join(__dirname, 'views'));

// Index page
app.get('/', function (req, res) {
 res.render('index');
});

// Upload image for translation
app.get('/translate_upload', function (req, res) {

  res.render('translate_upload', {target_language_dictionary: target_language_dictionary, result: '', image_file: image_file});
  console.log("GET TRANSLATE UPLOAD IMAGE")
 });


// Add image url for translation
app.get('/translate_url', function (req, res) {

 res.render('translate_url', {target_language_dictionary: target_language_dictionary, result: '', web_url: image_file});
 console.log("GET TRANSLATE URL")
});


// Add image url for landmark detection
app.get('/landmark_url', function (req, res) {

  res.render('landmark_url', {result: '', web_url: image_file});
  console.log("GET LANDMARK URL")
 });


// Upload image for landmark detection
 app.get('/landmark_upload', function (req, res) {

  res.render('landmark_upload', {result: '', image_file: image_file});
  console.log("GET LANDMARK URL")
 });

 app.get('/object_detect_url', function (req, res) {

  res.render('object_detect_url', {result: '', web_url: image_file});
  console.log("GET OBJECT DETECT URL")
 });

 app.get('/object_detect_upload', function (req, res) {

  res.render('object_detect_upload', {result: '', image_file: image_file});
  console.log("GET OBJECT DETECT UPLOAD")
 });


 app.get('/sentiment', function (req, res) {

  res.render('sentiment' , {result: ''});
  console.log("GET SENTIMENT")
 });


/*TRANSLATION UPLOAD IMAGE**********************************************************************************************/

// Translation from uploaded picture
app.post(, upload, async (req, res) => {

  /*
  @hint
  - Add the EJS view for translation with uploading of image

  - You will need the function upload for this request to process the image

  - Get the target language from the selection in the page

  - Get the path to the uploaded image

  - Process the image to binary

  - You will write 2 methods, one to process the image and one to extract text from the image:
    #1 Write an async POST method called submit_image_for_processing:
      * This will take the endpoint and image as inputs
      * Use GET for response headers (Operation-Location), this contains the URI for the second method
      * Return a variable that will call the second method

    #2 Write an async GET method called extract_text_from_image
      * Input will be the response headers from method #1 submit_image_for_processing
      * Return the extracted text from the image

  - Save the result from extract_text_from_image in the variable text_to_translate

  - Use the returned extracted text from the first method for the translation API call

  - Add params for translation API

  - Make a POST request to the translation API with  translation_response.
  We have added a processed url for you, but you will have to add method, params, headers and body.

  - Save the API call and translated result from translation_response in the variable translate_result

  - Get true or false score for translation_score to detect if the translation is successfull

  - Extract the text with translated lines from translate_result in the variable translate_result_to_view

  - Add conditional if there is no translation for the image, use the translation_score and translate_result_to_view

  - Add target_language_dictionary and result for output to the view
  */


  // Target language from form
  let target_language =


  // Path to uploaded image
  let image_path =


  // Process image to binary
  const base64 =
  const data =


 // First method: Process image
 const submit_image_for_processing = async (endpoint, data) => {

  const response = await fetch(endpoint, {
    method: ,
    params: ,
    headers: ,
    body:
  }),

  response_headers =

  result =

  return result

}

// Second method: Extract text from image and return result
const extract_text_from_image = async (response_headers) => {

  result = {}

  while (true){

    const response = await fetch(response_headers,{
      method: ,
      headers: ,
      location:
    })

  result =

  if ('analyzeResult' in result){
    break
    }

  if('status' in result && result.status == 'failed'){

    break
    }
 }
    return text_to_translate
}

// Save the result from extract_text_from_image in the variable text_to_translate
let text_to_translate =


// Add params for translation API
const _params= {
  'api-version': ,
  'to':
}


// Will process the endpoint and params for the API call
var URL = require('url').URL;
var url = new URL(translator_text_url)
const {URLSearchParams} = require('url');
url.search = new URLSearchParams(_params).toString();


// Add method, params, headers and body
const translation_response = await fetch(url, {
  method: ,
  baseUrl: translation_endpoint,
  url: 'translate',
  params: {
  },
  headers: {
  },
  body:
  })

  // Translate result
  const translate_result =

  // Extract the score and get true or false for detected language
  let translation_score =


  // Extract text with translated lines from translate_result
  translate_result_to_view =


  // Add conditional with translation_score and translate_result_to_view here


  // Add target_language_dictionary and result for output to the view
  res.render('translate_upload', {
    target_language_dictionary: ,
    result: ,
    image_file: `uploads/${req.file.filename}`,
  });
});

/*TRANSLATE URL API**********************************************************************************************/

// Translation image url
app.post(, async (req, res) => {

  /*
  @hint
  - Add the EJS view for translation with image url

  - Get the target language from the selection in the page

  - Get the image url

  - Add conditional  if there is no image url added

  - You will write 2 methods, one to process the image and one to extract text from the image:
    #1 Write an async POST method called submit_image_url_for_processing:
      * This will take the endpoint and image as inputs
      * Use GET for response headers (Operation-Location), this contains the URI for the second method
      * Return a variable that will call the second method

    #2 Write an async GET method called extract_text_from_image
      * Input will be the response headers from method #1 submit_image_for_processing
      * Return the extracted text from the image

  - Save the result from extract_text_from_image in the variable text_to_translate

  - Use the returned extracted text from the first method for the translation API call

  - Add params for translation API

  - Make a POST request to the translation API with  translation_response.
  We have added a processed url for you, but you will have to add method, params, headers and body.

  - Save the API call and translated result from translation_response in the variable translate_result

  - Get true or false score for translation_score to detect if the translation is successfull

  - Extract the text with translated lines from translate_result in the variable translate_result_to_view

  - Add conditional if there is no translation for the image, use the translation_score and translate_result_to_view

  - Add target_language_dictionary and result for output to the view
  */

// Get target language
let target_language =

// Get image url
web_url =

// Add conditional here if there is no image url added to the input field


// If image url is added, Extract text from images API (OCR)

  const submit_image_url_for_processing = async (endpoint, json, headers) => {
    const response = await fetch(endpoint, {
      method: ,
      headers: ,
      body:
    }),

    response_headers =

    result =
    return result
  }


  const extract_text_from_image = async (response_headers) => {
    result = {}
    while (true){

      const response = await fetch(response_headers,{
        method: ,
        headers: ,
        location:
      })

    result =

    if ('analyzeResult' in result){
      break}

    if('status' in result && result.status == 'failed'){
      break}}


    result =

    return text_to_translate

  }

// Save the result from extract_text_from_image in the variable text_to_translate
let text_to_translate =


// Add params for translation API
const _params= {
    'api-version': ,
    'to':
      }


// Will process the endpoint and params for the API call
var URL = require('url').URL;
var url = new URL(translator_text_url)
const {URLSearchParams} = require('url');
url.search = new URLSearchParams(_params).toString();


// Add method, params, headers and body
const translation_response = await fetch(url, {
method: ,
baseUrl: translation_endpoint,
url: 'translate',
params: ,
headers: ,
body:
})


// Save the result
const translate_result =

// Extract text with translated lines from translate_result
translate_result_to_view =

// Render result of translation to translate_url_test
res.render('translate_url', {target_language_dictionary: , result: , web_url: web_url});
});


/*LANDMARK URL API**********************************************************************************************/

// Post landmark_url, API call
app.post('/landmark_url', async (req, res) => {

  web_url = req.body.web_url
  console.log("WEB URL: ", web_url)

  if(web_url == ''){
    web_url = '/static/placeholder.png'
    res.render('landmark_url', {result: 'Please add an image URL in the input field',
    web_url: web_url});
  }

  else{

    const _params= {
      'visualFeatures': 'Categories,Description,Color'
        }

    var URL = require('url').URL;
    var url = new URL(analyze_endpoint)
    const {URLSearchParams} = require('url');
    url.search = new URLSearchParams(_params).toString();

    // If landmark is found
    try {

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        params: {
          'visualFeatures': 'Categories,Description,Color'},
        body: JSON.stringify({'url': web_url})
      }),

      // Translate result
      landmark_url_result = await response.json()



      landmark_result_to_html = landmark_url_result.categories[0].detail.landmarks[0].name
      console.log("TRANSLATE RESULT", landmark_result_to_html)

      res.render('landmark_url', {result: landmark_result_to_html, web_url: web_url})
      }

      // Catch error and no detected landmarks
      catch(error){

        result = 'Could not find a result for this image'

        res.render('landmark_url', {result: result, web_url: web_url})
        }
    }

});

/*LANDMARK UPLOAD API**********************************************************************************************/

app.post('/landmark_upload', upload, async (req, res) => {

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

  const _params= {
    'visualFeatures': 'Categories,Description,Color'
    }

  var URL = require('url').URL;
  var url = new URL(analyze_endpoint)
  const {URLSearchParams} = require('url');
  url.search = new URLSearchParams(_params).toString();

  // If landmark is found
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      params: {
        'visualFeatures': 'Categories,Description,Color'},
      body: data
    }),

    // Translate result
    landmark_upload_result = await response.json()

    landmark_result_to_html = landmark_upload_result.categories[0].detail.landmarks[0].name
    console.log("TRANSLATE RESULT", landmark_result_to_html)

    res.render('landmark_upload', {result: landmark_result_to_html, image_file: `uploads/${req.file.filename}`})
    }

    // Catch error and no detected landmarks
    catch(error){

      result = 'Could not find a result for this image'

      res.render('landmark_upload', {result: result, image_file: `uploads/${req.file.filename}`})
      }

});

/*OBJECT DETECT UPLOAD API**********************************************************************************************/

// Post landmark_url, API call
app.post('/object_detect_url', async (req, res) => {

  web_url = req.body.web_url
  console.log("WEB URL: ", web_url)

  if(web_url == ''){
    web_url = '/static/placeholder.png'
    res.render('object_detect_url', {result: 'Please add an image URL in the input field',
    web_url: web_url});
  }

  else{

    const _params= {
      'visualFeatures': 'Objects,Description'
        }

    var URL = require('url').URL;
    var url = new URL(analyze_endpoint)
    const {URLSearchParams} = require('url');
    url.search = new URLSearchParams(_params).toString();

    // If landmark is found
    try {

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        params: {
          'visualFeatures': 'Objects,Description'},
        body: JSON.stringify({'url': web_url})
      }),

      // Object detection result
      object_url_result = await response.json()

      console.log("RESULT: ", object_url_result)

      // List to add all objects from result
      object_to_html_list = []
      object_url_result_to_html = object_url_result.objects

      // Filter out all objects and add to list
      for(i=0; i<object_url_result_to_html.length; i++){
        object_to_add = object_url_result_to_html[i].object
        object_to_html_list.push(object_to_add.toUpperCase())
      }

      // Render result to page
      res.render('object_detect_url', {result: object_to_html_list, web_url: web_url})
      }

      // Catch error and no detected objects
      catch(error){

        result = 'Could not find a result for this image'

        res.render('object_detect_url', {result: result, web_url: web_url})
        }
    }

});

//****************************************************************************************************************************/
// Object detection upload image

app.post('/object_detect_upload', upload, async (req, res) => {

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

  const _params= {
    'visualFeatures': 'Objects,Description'
    }

  var URL = require('url').URL;
  var url = new URL(analyze_endpoint)
  const {URLSearchParams} = require('url');
  url.search = new URLSearchParams(_params).toString();

  // If landmark is found
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      params: {
        'visualFeatures': 'Objects,Description'},
      body: data
    }),


    // Object detection result
    object_upload_result = await response.json()

    console.log("RESULT: ", object_upload_result)

    // List to add all objects from result
    object_to_html_list = []
    object_upload_objects = object_upload_result.objects

    // Filter out all objects and add to list
    for(i=0; i<object_upload_objects.length; i++){
      object_to_add = object_upload_objects[i].object
      object_to_html_list.push(object_to_add.toUpperCase())
    }

    console.log("LIST", object_to_html_list)


    if(object_to_html_list == undefined || object_to_html_list.length == 0){
      console.log("No objects")
      result = 'No objects detected'

      res.render('object_detect_upload', {result: result, image_file: `uploads/${req.file.filename}`})
    }

    else{
      console.log("Objects detected")

      res.render('object_detect_upload', {result: object_to_html_list, image_file: `uploads/${req.file.filename}`})
  }
    }

    // Catch error and no detected landmarks
    catch(error){

      result = 'Could not find a result for this image'

      res.render('object_detect_upload', {result: result, image_file: `uploads/${req.file.filename}`})
      }

});

//****************************************************************************************************************************/
// Sentiment analysis

// Post translate_url, API call
app.post('/sentiment', async (req, res) => {

  sentiment_text = req.body.sentiment_text

  if(sentiment_text == ''){
    res.render('sentiment', { result: 'Please add text. ',
    sentiment_text: sentiment_text});
  }

  else{
    sentiment_text = JSON.stringify(sentiment_text)

  // Translation API, translate to English
  const _params= {
    'api-version': '3.0',
    'to': 'en'
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
  'to': 'en'
},
headers: {
  'Ocp-Apim-Subscription-Key': translate_key,
  'Ocp-Apim-Subscription-Region': 'eastus',
  'Content-type': 'application/json',
  'X-ClientTraceId': '315abf80-187a-4df1-89d3-bcf7f15cac36' // uuidv4().toString()
},
body: JSON.stringify([{
      'text': sentiment_text
}])
})

// Translate result
const translate_result = await response.json()

// Extract text with translated lines from translate_result
translate_result_to_html = translate_result[0].translations[0].text


// Replace characters with plain text for output
translate_text = translate_result_to_html.replace("[","").replace("]","").
replace('"','').replace('"','').replace(',','').replace('"','').replace('"','')


// Sentiment API
  const sentiment_response = await fetch(sentiment_url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': _sentiment_key,
      'Content-type': 'application/json',
      'Ocp-Apim-Subscription-Region': 'eastus',
      'X-ClientTraceId': '35ddc2ff-b916-43b0-a09f-1ee18fe8f0df' //uuidv4().toString()
      },
      body: JSON.stringify
      (
        {"documents": [
        {"id": "1", "language": 'en',
            "text": translate_text}
                  ]
                }
      )
  })

  const sentiment_result = await sentiment_response.json()

  let result_text = ''

  sentiment_score = sentiment_result.documents[0].score.toFixed(2) * 100

  if(sentiment_score >= 50){

    result_text = `This is probably a positive sentence with a ${sentiment_score} % sentiment score.`


  }
  else{

    result_text = result_text = `This is probably a negative sentence with a ${sentiment_score} % sentiment score.`

  }


  // Render result of translation to translate_url_test
  res.render('sentiment', { result: result_text, sentiment_text: sentiment_text});
}

});




