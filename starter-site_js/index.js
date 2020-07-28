// Add request (how to use something different here than request?)
const request = require("request");

// load env var
require("dotenv").config({ path: "./../.env" });

// Init express
const express = require("express"),
  path = require("path");

// Multer to process upload image
const multer = require("multer");

// Filesystem module
const fs = require("fs");

// util module
const util = require("util");

// Add node-fetch
const fetch = require("node-fetch");

// Initialize app with express
const app = express();

// Middleware to extract data from form
app.use(express.urlencoded());

// Server run on port number on environment or port
const PORT = process.env.PORT || 5000;

// Run the webserver by listening to the port
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// Static public folder
app.use(express.static("./public"));

// Set storage engine Multer
const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: function(req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  }
});

// Init upload Multer
const upload = multer({
  storage: storage
}).single("myImage");

// Download image url to public folder
const downloadImage = (url, path, callback) => {
  request.head(url, (err, res, body) => {
    request(url)
      .pipe(fs.createWriteStream(path))
      .on("close", callback);
  });
};

const imageToBinary = image_path => {
  // Process image to binary
  const base64 = fs.readFileSync(image_path, "base64");
  //const data = Buffer.from(base64, 'base64')
  return Buffer.from(base64, "base64");
};

const processUrl = (urlToProcess, _params) => {
  // Process the url for translation API call
  var URL = require("url").URL;
  var url = new URL(urlToProcess);
  const { URLSearchParams } = require("url");
  url.search = new URLSearchParams(_params).toString();

  return url;
};

//* load env vars ---------------------------------------------------------------------------------

const apiKey = process.env._key;

const translateKey = process.env.translate_key;

const sentimentKey = process.env._sentiment_key;

const baseUrl = process.env.base_url;

const sentimentBaseUrl = process.env._sentiment_url;

// Custom vision key
const training_key = process.env.training_key;

// Custom vision key
const prediction_key = process.env.prediction_key;

// Custom vision key
const prediction_resource_id = process.env.prediction_resource_id;

// Custom vision sampleProject
const sampleProjectID = process.env.sampleProject;

COGSVCS_CLIENTURL = baseUrl;
COGSVCS_KEY = apiKey;

/*API**********************************************************************************************/

// OCR API
const textRecognitionUrl = baseUrl + "/vision/v3.0/read/analyze";

// Foundation url for azure account
const azure_base_url = baseUrl;

// Computer Vision API
const analyzeEndpoint = azure_base_url + "/vision/v3.0/analyze";

// Cognitive API for Translator Text
const translatorTextUrl =
  "https://api.cognitive.microsofttranslator.com/" +
  "/translate?api-version=3.0";

// Translation API
let translationUrl = "https://api.cognitive.microsofttranslator.com/";

// Sentiment API
const sentimentUrl = sentimentBaseUrl + "/text/analytics/v2.1/sentiment";

// Headers for API call (image url)
const jsonHeaders = {
  "Content-Type": "application/json",
  "Ocp-Apim-Subscription-Key": apiKey
};

// Headers for API call (upload image)
const blobHeaders = {
  "Content-Type": "application/octet-stream",
  "Ocp-Apim-Subscription-Key": apiKey
};

// Translation params
const translationParams = target_language => {
  // Params needed for translation API call
  const params = {
    "api-version": "3.0",
    to: [target_language]
  };
  return params;
};

const landmarkParams = {
  visualFeatures: "Categories,Description,Color"
};

const objectDetectionParams = {
  visualFeatures: "Objects,Description"
};

/*CUSTOM VISION API**********************************************************************************************/

const TrainingApi = require("@azure/cognitiveservices-customvision-training");
const PredictionApi = require("@azure/cognitiveservices-customvision-prediction");
const msRest = require("@azure/ms-rest-js");
const { resolveNaptr } = require("dns");
const { json } = require("express");

const setTimeoutPromise = util.promisify(setTimeout);

// Keys
const trainingKey = training_key;
const predictionKey = prediction_key;
const predictionResourceId = prediction_resource_id;

// Root where images are stored
const sampleDataRoot = "";

// Custom vision endpoint
const endPoint = "https://eastus.api.cognitive.microsoft.com/";

const credentials = new msRest.ApiKeyCredentials({
  inHeader: { "Training-key": trainingKey }
});
const trainer = new TrainingApi.TrainingAPIClient(credentials, endPoint);

// Set model name
const publishIterationName = "classifyModel";

/*TRANSLATION**********************************************************************************************/

let webUrl = "/static/placeholder.png";

let imageFile = "/static/placeholder.png";

let targetLanguageDictionary = [
  { key: "English", value: "en" },
  { key: "Chinese (simplified)", value: "zh-Hans" },
  { key: "Chinese (traditional)", value: "zh-Hant" },
  { key: "French", value: "fr" },
  { key: "German", value: "de" },
  { key: "Italian", value: "it" },
  { key: "Japanese", value: "ja" },
  { key: "Korean", value: "ko" },
  { key: "Portugese", value: "pt" },
  { key: "Spanish", value: "es" }
];

/*EJS**********************************************************************************************/

// To use extend in html, npm i express-ejs-extend
app.engine("ejs", require("express-ejs-extend"));

// Set ejs
app.set("view engine", "ejs");

// Join paths with 'views'
app.set("views", path.join(__dirname, "views"));

app.get("/", function(req, res) {
  res.render("index");
});

app.get("/translate_upload", function(req, res) {
  res.render("translate_upload", {
    target_language_dictionary: targetLanguageDictionary,
    result: "",
    image_file: imageFile
  });
  console.log("GET TRANSLATE UPLOAD IMAGE");
});

app.get("/translate_url", function(req, res) {
  res.render("translate_url", {
    target_language_dictionary: targetLanguageDictionary,
    result: "",
    web_url: imageFile
  });
  console.log("GET TRANSLATE URL");
});

app.get("/landmark_url", function(req, res) {
  res.render("landmark_url", { result: "", web_url: imageFile });
  console.log("GET LANDMARK URL");
});

app.get("/landmark_upload", function(req, res) {
  res.render("landmark_upload", { result: "", image_file: imageFile });
  console.log("GET LANDMARK URL");
});

app.get("/object_detect_url", function(req, res) {
  res.render("object_detect_url", { result: "", web_url: imageFile });
  console.log("GET OBJECT DETECT URL");
});

app.get("/object_detect_upload", function(req, res) {
  res.render("object_detect_upload", { result: "", image_file: imageFile });
  console.log("GET OBJECT DETECT UPLOAD");
});

app.get("/sentiment", function(req, res) {
  res.render("sentiment", { result: "" });
  console.log("GET SENTIMENT");
});

app.get("/custom_vision_upload", function(req, res) {
  res.render("custom_vision_upload", { result: "", image_file: imageFile });
  console.log("GET CUSTOM VISION UPLOAD");
});

app.get("/custom_vision_url", function(req, res) {
  res.render("custom_vision_url", { result: "", web_url: imageFile });
  console.log("GET CUSTOM VISION URL");
  //console.log(TrainingApi.TrainingAPIMappers.Project.type)
});

/*POST**********************************************************************************************/

/*TRANSLATION UPLOAD IMAGE**********************************************************************************************/

// Translation from uploaded picture
app.post("/translate_upload", upload, async (req, res) => {
  // Selected target language from form
  let targetLanguage = req.body.target_language;

  // Path to uploaded image
  let imagePath = req.file.path;

  // Process image to binary
  let body = imageToBinary(imagePath);

  // Write Function to extract text from image called `extractTextFromImage` here

  // write Function translated result called `translateResult` here

  // Save the extracted text retured from the result of call to extractTextFromImage
  let extractedText = [];

  // Add extracted_text to translate function and save result i.e. `await translateResult(extractedText)`
  let result = "please implement functions";

  // Render to ejs page
  res.render("translate_upload", {
    target_language_dictionary: targetLanguageDictionary,
    result: result,
    image_file: `uploads/${req.file.filename}`
  });
});

/*TRANSLATE URL API**********************************************************************************************/

// Post translate_url, API call
app.post("/translate_url", async (req, res) => {
  // Choosen target language from form
  let targetLanguage = req.body.target_language;

  // Pasted image url from form
  webUrl = req.body.web_url;
  console.log("WEB URL", webUrl);

  // Write Function to extract text from image called `extractTextFromImage` here

  // write Function translated result called `translateResult` here

  // Save the extracted text retured from the result of call to extractTextFromImage (pass in a str(url) instead i.e. await extractTextFromImage(...)
  let extractedText = [];

  // call with extracted_text to translate function and save result i.e. `await translateResult(extractedText)`
  let result = "please implement functions";

  // Render to ejs page
  res.render("translate_url", {
    target_language_dictionary: targetLanguageDictionary,
    result: result,
    web_url: webUrl
  });
});

/*LANDMARK URL API**********************************************************************************************/

// Post landmark_url, API call
app.post("/landmark_url", async (req, res) => {
  // Web url pasted to the view
  webUrl = req.body.web_url;

  // write a function called `processLandmark` that takes a str(url) and returns a landmark name

  // call the processLandmark and await result i.e. `await processLandmark(webUrl)`
  let result = "please implement functions";

  // Render result to view
  res.render("landmark_url", { result: result, web_url: webUrl });
});

/*LANDMARK UPLOAD API**********************************************************************************************/

app.post("/landmark_upload", upload, async (req, res) => {
  // Path to uploaded image
  let imagePath = req.file.path;

  // Process image to binary
  let body = imageToBinary(imagePath);

  // write a function called `processLandmark` that returns a landmark name here

  // call the processLandmark and await result i.e. `await processLandmark(body)`
  let result = "please implement functions";

  // Render result to view
  res.render("landmark_upload", {
    result: result,
    image_file: `uploads/${req.file.filename}`
  });
});

/*OBJECT DETECT UPLOAD API**********************************************************************************************/

// Object detection image url
app.post("/object_detect_url", async (req, res) => {
  webUrl = req.body.web_url;

  // write a function called `processObjectDetection` that returns a list of objects

  // call the processObjectDetection and await result i.e. `await processObjectDetection(webUrl)`
  let result = [];

  // Render result to page
  res.render("object_detect_url", { result: result, web_url: webUrl });
});

//****************************************************************************************************************************/
// Object detection upload image

app.post("/object_detect_upload", upload, async (req, res) => {
  // Path to uploaded image
  let imagePath = req.file.path;

  // write a function called `processObjectDetection` that returns a list of objects

  // call the processObjectDetection and await result i.e. `await processObjectDetection(imagePath)`
  let result = [];

  res.render("object_detect_upload", {
    result: result,
    image_file: `uploads/${req.file.filename}`
  });
});

//****************************************************************************************************************************/
// Sentiment analysis

// Post translate_url, API call
app.post("/sentiment", async (req, res) => {
  sentimentText = req.body.sentiment_text;
  // write a function called `processTranslation` that returns the translation

  // write a function called `processSentiment` that returns the sentiment score

  // Translate text to English i.e. await processTranslation(sentimentText);
  let translateText = "translated text";

  // Return sentiment result i.e. await processSentiment(translateText);
  let result = "please implement functions";
  // Render result of translation to translate_url_test
  res.render("sentiment", { result: result, sentiment_text: sentimentText });
});

/*CUSTOM VISION URL API**********************************************************************************************/

// Custom Vision image url API call
app.post("/custom_vision_url", async (req, res) => {
  webUrl = req.body.web_url;
  console.log("WEB URL: ", webUrl);

  // write a function called processCustomVision that makes a prediction based on webURL and renders result to the page
  // IMPORTANT!!! this will only work after you run the custom_vision.js script in API_scripts folder

  // Call function and use custom vision by uncommenting the line below
  // await processCustomVision(webUrl);

  res.render("custom_vision_url", {
    result: "please implement functions",
    web_url: webUrl
  });
});
