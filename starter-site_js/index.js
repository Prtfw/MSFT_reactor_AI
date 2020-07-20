// load env variables
require("dotenv").config({ path: "./../.env" });

// Load libraries
const fetch = require("node-fetch");
const express = require("express");
const path = require("path");
const URL = require("url").URL;

// Multer to process upload image
const multer = require("multer");
// Filesystem module
const fs = require("fs");
// Initialize app with express
const app = express();
// Middleware to extract data from form
app.use(express.urlencoded());

// Server run on port number on environment or port
const port = process.env.PORT || 5000;

// Run the webserver by listening to the port
app.listen(port, () => console.log(`Server started on port ${port}`));

// Static files
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

//* load env vars ---------------------------------------------------------------------------------

const apiKey = process.env._key;

const translateKey = process.env.translate_key;

const sentimentKey = process.env._sentiment_key;

const baseUrl = process.env.base_url;

/*API**********************************************************************************************/

const sentimentBaseUrl =
  "https://youraccount-text-analytics.cognitiveservices.azure.com/";

// OCR API
const textRecognitionUrl = baseUrl + "/vision/v3.0/read/analyze";

// Computer Vision API
const analyzeUrl = baseUrl + "/vision/v3.0/analyze";

// Cognitive API for Translator Text
const translatorTextUrl =
  "https://api.cognitive.microsofttranslator.com/" +
  "/translate?api-version=3.0";

// Translation API
const translationUrl = "https://api.cognitive.microsofttranslator.com/";

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

/*TRANSLATION**********************************************************************************************/

const webUrl = "/static/placeholder.png";

const imageFile = "/static/placeholder.png";

const targetLanguageDictionary = [
  { key: "English", value: "en" },
  { key: "Chinese (simplified)", value: "zh-Hans" },
  { key: "Chinese (traditional)", value: "zh-Hant" },
  { key: "French", value: "fr" },
  { key: "German", value: "de" },
  { key: "Italian", value: "it" },
  { key: "Japanese", value: "ja" },
  { key: "Korean", value: "ko" },
  { key: "Portuguese", value: "pt" },
  { key: "Spanish", value: "es" }
];

/*EJS**********************************************************************************************/

// To use extend in html
app.engine("ejs", require("express-ejs-extend"));

// Set ejs
app.set("view engine", "ejs");

// Join paths with 'views'
app.set("views", path.join(__dirname, "views"));

// Index page
app.get("/", async (req, res) => {
  res.render("index");
});

// Upload image for translation
app.get("/translate_upload", async (req, res) => {
  res.render("translate_upload", {
    target_language_dictionary: targetLanguageDictionary,
    result: "",
    image_file: imageFile
  });
  console.log("GET TRANSLATE UPLOAD IMAGE");
});

// Add image url for translation
app.get("/translate_url", async (req, res) => {
  res.render("translate_url", {
    target_language_dictionary: targetLanguageDictionary,
    result: "",
    web_url: imageFile
  });
  console.log("GET TRANSLATE URL");
});

// Add image url for landmark detection
app.get("/landmark_url", async (req, res) => {
  res.render("landmark_url", { result: "", web_url: imageFile });
  console.log("GET LANDMARK URL");
});

// Upload image for landmark detection
app.get("/landmark_upload", async (req, res) => {
  res.render("landmark_upload", { result: "", image_file: imageFile });
  console.log("GET LANDMARK URL");
});

app.get("/object_detect_url", async (req, res) => {
  res.render("object_detect_url", { result: "", web_url: imageFile });
  console.log("GET OBJECT DETECT URL");
});

app.get("/object_detect_upload", async (req, res) => {
  res.render("object_detect_upload", { result: "", image_file: imageFile });
  console.log("GET OBJECT DETECT UPLOAD");
});

app.get("/sentiment", async (req, res) => {
  res.render("sentiment", { result: "" });
  console.log("GET SENTIMENT");
});

/*TRANSLATION UPLOAD IMAGE**********************************************************************************************/

// Translation from uploaded picture
app.post("/translate_upload", upload, async (req, res) => {
  /*
  @hint

   - TODO: fill out the submitImageForProcessing fn to make a POST call to the text recongition api
   - TODO: fill out the extractTextFromImage fn to get only the translated text lines from translate_result in the format translate_result[0].translations[0].text

  */

  const targetLanguage = req.body.target_language;

  // Path to uploaded image
  const imagePath = req.file.path;

  // Process image to binary
  const base64 = fs.readFileSync(imagePath, "base64");
  const data = Buffer.from(base64, "base64");

  // Process the image
  const submitImageForProcessing = async (endpoint, data) => {
    let result = ["some", "list", "of", "words"];
    const response =
      "@student await the result of the POST call to the 'endpoint' here ";
    responseHeaders = response.headers.get("Operation-Location", blobHeaders);

    // Result is the extracted text
    result = await extractTextFromImage(responseHeaders);

    return Promise.resolve(result);
  };

  // Extract text from images API (OCR)
  const extractTextFromImage = async response_url => {
    console.log("in process text function");

    let result = {};

    while (true) {
      const response =
        "@student await the result of the GET call to the 'response_url' here ";

      result = await response.json();

      if ("analyzeResult" in result) {
        break;
      }

      if ("status" in result && result.status == "failed") {
        break;
      }
    }

    result = result.analyzeResult.readResults[0].lines;
    const extractedTextList = [];
    for (const i in result) {
      words = result[i].text;
      words = words.toLowerCase();
      extractedTextList.push(words);
    }
    extractedTextList = extractedTextList.join(" ");
    extractedTextList = JSON.stringify(extractedTextList);

    // Return the extracted text
    return Promise.resolve(extractedTextList);
  };

  // Save the extracted text from the result
  const extractedText = await submitImageForProcessing(
    textRecognitionUrl,
    data,
    blobHeaders
  );
  console.log("RESP,", extractedText);

  // Params needed for translation API call
  const params = {
    "api-version": "3.0",
    to: [targetLanguage]
  };

  // Process the translation url for translation API call
  const url = new URL(translatorTextUrl);
  const { URLSearchParams } = require("url");
  url.search = new URLSearchParams(params).toString();

  // Translation API call
  const translation_response = await fetch(url, {
    method: "POST",
    baseUrl: translationUrl,
    url: "translate",
    params: {
      "api-version": "3.0",
      to: [targetLanguage]
    },
    headers: {
      "Ocp-Apim-Subscription-Key": translateKey,
      "Ocp-Apim-Subscription-Region": "australiaeast",
      "Content-type": "application/json",
      "X-ClientTraceId": "315abf80-187a-4df1-89d3-bcf7f15cac36"
    },
    body: JSON.stringify([
      {
        text: extractedText
      }
    ])
  });

  // Result with translated text
  const translateResult = await translation_response.json();

  // TODO: Use translate_result to detect if a translation is found in the format translate_result[0].detectedLanguage.score
  // score 0 = Could not find any text to translate
  // score 1 = Found text to translate
  let translationScore = "";

  // TODO: Extract only the translated text lines from translate_result in the format translate_result[0].translations[0].text
  translateResultToView = "";

  // If there is no translated result
  if (translationScore == 0) {
    translateResultToView =
      "Could not find any text to translate in the picture. ";
  }

  // Render to ejs page
  res.render("translate_upload", {
    target_language_dictionary: targetLanguageDictionary,
    result: translateResultToView,
    image_file: `uploads/${req.file.filename}`
  });
});

/*TRANSLATE URL API**********************************************************************************************/

// Translation image url
app.post("/translate_url", async (req, res) => {
  /*
  @hint

   - TODO: fill out the submitImageUrlForProcessing fn to make a POST call to the text recongition api
   - TODO: fill out the extractTextFromImageUrl fn to get only the translated text lines from translate_result in the format translate_result[0].translations[0].text

  */
  // Extract the text from the image
  const extractTextFromImageUrl = async response_url => {
    result = {};
    while (true) {
      const response =
        "@student await the result of the GET call to the 'response_url' here ";

      result = await response.json();

      if ("analyzeResult" in result) {
        break;
      }

      if ("status" in result && result.status == "failed") {
        break;
      }
    }

    result = result.analyzeResult.readResults[0].lines;
    let extractedTextList = [];
    for (const i in result) {
      words = result[i].text;
      words = words.toLowerCase();
      extractedTextList.push(words);
    }
    extractedTextList = extractedTextList.join(" ");
    extractedTextList = JSON.stringify(extractedTextList);

    console.log(116, "RETURN RESULT: ", extractedTextList);

    return Promise.resolve(extractedTextList);
  };

  // Process image
  const submitImageUrlForProcessing = async (endpoint, json, headers) => {
    let result = ["some", "list", "of", "words"];
    const response =
      "@student await the result of the POST call to the 'endpoint' here ";
    response_headers = response.headers.get("Operation-Location", headers);

    // Use response headers to extract the text from the image and return result
    result = await extractTextFromImageUrl(response_headers);
    return Promise.resolve(result);
  };
  /*
  @hint

  - TODO: fill out the submit_image_url_for_processing fn to make a POST call to the text recongition api
  - TODO: fill out the extractTextFromImageUrl fn to get only the translated text lines from translate_result in the format translate_result[0].translations[0].text

  */

  // Choosen target language from form
  const targetLanguage = req.body.target_language;

  // Pasted image url from form
  let webUrl = req.body.web_url;

  // If no image url is pasted
  if (webUrl == "") {
    webUrl = "/static/placeholder.png";
    res.render("translate_url", {
      target_language_dictionary: targetLanguageDictionary,
      result: "Please add an image URL in the input field",
      web_url: webUrl
    });
  } else {
    // Save the extracted text from the result
    const extractedText = await submitImageUrlForProcessing(
      textRecognitionUrl,
      webUrl,
      jsonHeaders
    );
    console.log("WORD LIST,", extractedText);

    // Params needed for translation API call
    const params = {
      "api-version": "3.0",
      to: [targetLanguage]
    };

    // Process the translation url for translation API call
    const url = new URL(translatorTextUrl);
    const { URLSearchParams } = require("url");
    url.search = new URLSearchParams(params).toString();

    // Translation API call
    const translation_response = await fetch(url, {
      method: "POST",
      baseUrl: translationUrl,
      url: "translate",
      params: {
        "api-version": "3.0",
        to: [targetLanguage]
      },
      headers: {
        "Ocp-Apim-Subscription-Key": translateKey,
        "Ocp-Apim-Subscription-Region": "australiaeast",
        "Content-type": "application/json",
        "X-ClientTraceId": "315abf80-187a-4df1-89d3-bcf7f15cac36"
      },
      body: JSON.stringify([
        {
          text: extractedText
        }
      ])
    });

    // TODO: Use translate_result to detect if a translation is found in the format translate_result[0].detectedLanguage.score
    // score 0 = Could not find any text to translate
    // score 1 = Found text to translate
    let translationScore = "";

    // TODO: Extract only the translated text lines from translate_result in the format translate_result[0].translations[0].text
    let translateResultToView = "";

    // If there is no translated result
    if (translationScore == 0) {
      translateResultToView =
        "Could not find any text to translate in the picture. ";
    }

    // Render result of translation to translate_url_test
    res.render("translate_url", {
      target_language_dictionary: targetLanguageDictionary,
      result: translateResultToView,
      web_url: webUrl
    });
  }
});

/*LANDMARK URL API**********************************************************************************************/

// Post landmark_url, API call
app.post("/landmark_url", async (req, res) => {
  const webUrl = req.body.web_url;
  console.log("WEB URL: ", webUrl);

  if (webUrl == "") {
    webUrl = "/static/placeholder.png";
    res.render("landmark_url", {
      result: "Please add an image URL in the input field",
      web_url: webUrl
    });
  } else {
    const params = {
      visualFeatures: "Categories,Description,Color"
    };

    const url = new URL(analyzeUrl);
    const { URLSearchParams } = require("url");
    url.search = new URLSearchParams(params).toString();

    // If landmark is found
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        params: {
          visualFeatures: "Categories,Description,Color"
        },
        body: JSON.stringify({ url: webUrl })
      });
      // Translate result
      const landmarkUrlResult = await response.json();

      const landmarkResultToHtml =
        landmarkUrlResult.categories[0].detail.landmarks[0].name;
      console.log("TRANSLATE RESULT", landmarkResultToHtml);

      res.render("landmark_url", {
        result: landmarkResultToHtml,
        web_url: webUrl
      });
    } catch (error) {
      // Catch error and no detected landmarks
      result = "Could not find a result for this image";

      res.render("landmark_url", { result: result, web_url: webUrl });
    }
  }
});

/*LANDMARK UPLOAD API**********************************************************************************************/

app.post("/landmark_upload", upload, async (req, res) => {
  // Path to uploaded image
  let imagePath = req.file.path;

  // Process image to binary
  const base64 = fs.readFileSync(imagePath, "base64");
  const data = Buffer.from(base64, "base64");

  // Headers
  const headers = {
    "Content-Type": "application/octet-stream",
    "Ocp-Apim-Subscription-Key": apiKey
  };

  const params = {
    visualFeatures: "Categories,Description,Color"
  };

  const url = new URL(analyzeUrl);
  const { URLSearchParams } = require("url");
  url.search = new URLSearchParams(params).toString();

  // If landmark is found
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      params: {
        visualFeatures: "Categories,Description,Color"
      },
      body: data
    });
    // Translate result
    const landmarkUploadResult = await response.json();

    const landmarkResultToHtml =
      landmarkUploadResult.categories[0].detail.landmarks[0].name;
    console.log("TRANSLATE RESULT", landmarkResultToHtml);

    res.render("landmark_upload", {
      result: landmarkResultToHtml,
      image_file: `uploads/${req.file.filename}`
    });
  } catch (error) {
    // Catch error and no detected landmarks
    result = "Could not find a result for this image";

    res.render("landmark_upload", {
      result: result,
      image_file: `uploads/${req.file.filename}`
    });
  }
});

/*OBJECT DETECT UPLOAD API**********************************************************************************************/

// Post landmark_url, API call
app.post("/object_detect_url", async (req, res) => {
  const webUrl = req.body.web_url;
  console.log("WEB URL: ", webUrl);

  if (webUrl === "") {
    webUrl = "/static/placeholder.png";
    res.render("object_detect_url", {
      result: "Please add an image URL in the input field",
      web_url: webUrl
    });
  } else {
    const _params = {
      visualFeatures: "Objects,Description"
    };

    const url = new URL(analyzeUrl);
    const { URLSearchParams } = require("url");
    url.search = new URLSearchParams(_params).toString();

    // If landmark is found
    try {
      const response = await fetch(url, {
          method: "POST",
          headers: headers,
          params: {
            visualFeatures: "Objects,Description"
          },
          body: JSON.stringify({ url: webUrl })
        }),
        // Object detection result
        object_url_result = await response.json();

      console.log("RESULT: ", object_url_result);

      // List to add all objects from result
      const objectToHtmlList = [];
      const objectUrlResultToHtml = object_url_result.objects;

      // Filter out all objects and add to list
      for (i = 0; i < objectUrlResultToHtml.length; i++) {
        const objectToAdd = objectUrlResultToHtml[i].object;
        objectToHtmlList.push(objectToAdd.toUpperCase());
      }

      // Render result to page
      res.render("object_detect_url", {
        result: objectToHtmlList,
        web_url: webUrl
      });
    } catch (error) {
      // Catch error and no detected objects
      result = "Could not find a result for this image";

      res.render("object_detect_url", { result: result, web_url: webUrl });
    }
  }
});

//****************************************************************************************************************************/
// Object detection upload image

app.post("/object_detect_upload", upload, async (req, res) => {
  // Path to uploaded image
  const imagePath = req.file.path;

  // Process image to binary
  const base64 = fs.readFileSync(imagePath, "base64");
  const data = Buffer.from(base64, "base64");

  // Headers
  const headers = {
    "Content-Type": "application/octet-stream",
    "Ocp-Apim-Subscription-Key": apiKey
  };

  const params = {
    visualFeatures: "Objects,Description"
  };
  const url = new URL(analyzeUrl);
  const { URLSearchParams } = require("url");
  url.search = new URLSearchParams(params).toString();

  // If landmark is found
  try {
    const response = await fetch(url, {
        method: "POST",
        headers: headers,
        params: params,
        body: data
      }),
      // Object detection result
      object_upload_result = await response.json();

    console.log("RESULT: ", object_upload_result);

    // List to add all objects from result
    const objectToHtmlList = [];
    const objectUploadObjects = object_upload_result.objects;

    // Filter out all objects and add to list
    for (i = 0; i < objectUploadObjects.length; i++) {
      const objectToAdd = objectUploadObjects[i].object;
      objectToHtmlList.push(objectToAdd.toUpperCase());
    }

    console.log("LIST", objectToHtmlList);

    if (objectToHtmlList === undefined || objectToHtmlList.length == 0) {
      console.log("No objects");
      result = "No objects detected";

      res.render("object_detect_upload", {
        result: result,
        image_file: `uploads/${req.file.filename}`
      });
    } else {
      console.log("Objects detected");

      res.render("object_detect_upload", {
        result: objectToHtmlList,
        image_file: `uploads/${req.file.filename}`
      });
    }
  } catch (error) {
    // Catch error and no detected landmarks
    result = "Could not find a result for this image";

    res.render("object_detect_upload", {
      result: result,
      image_file: `uploads/${req.file.filename}`
    });
  }
});

//****************************************************************************************************************************/
// Sentiment analysis

// Post translate_url, API call
app.post("/sentiment", async (req, res) => {
  sentiment_text = req.body.sentiment_text;

  if (sentiment_text == "") {
    res.render("sentiment", {
      result: "Please add text. ",
      sentiment_text: sentiment_text
    });
  } else {
    sentiment_text = JSON.stringify(sentiment_text);

    // Translation API, translate to English
    const _params = {
      "api-version": "3.0",
      to: "en"
    };

    const url = new URL(translatorTextUrl);

    const { URLSearchParams } = require("url");
    url.search = new URLSearchParams(_params).toString();

    const response = await fetch(url, {
      method: "POST",
      baseUrl: translationUrl,
      url: "translate",
      params: {
        "api-version": "3.0",
        to: "en"
      },
      headers: {
        "Ocp-Apim-Subscription-Key": translateKey,
        "Ocp-Apim-Subscription-Region": "eastus",
        "Content-type": "application/json",
        "X-ClientTraceId": "315abf80-187a-4df1-89d3-bcf7f15cac36" // uuidv4().toString()
      },
      body: JSON.stringify([
        {
          text: sentiment_text
        }
      ])
    });

    // Translate result
    const translate_result = await response.json();

    // Extract text with translated lines from translate_result
    translate_result_to_html = translate_result[0].translations[0].text;

    // Replace characters with plain text for output
    translate_text = translate_result_to_html
      .replace("[", "")
      .replace("]", "")
      .replace('"', "")
      .replace('"', "")
      .replace(",", "")
      .replace('"', "")
      .replace('"', "");

    // Sentiment API
    const sentiment_response = await fetch(sentimentUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": sentimentKey,
        "Content-type": "application/json",
        "Ocp-Apim-Subscription-Region": "eastus",
        "X-ClientTraceId": "35ddc2ff-b916-43b0-a09f-1ee18fe8f0df"
      },
      body: JSON.stringify({
        documents: [{ id: "1", language: "en", text: translate_text }]
      })
    });

    const sentimentResult = await sentiment_response.json();

    let resultText = "";

    sentiment_score = sentimentResult.documents[0].score.toFixed(2) * 100;

    if (sentiment_score >= 50) {
      resultText = `This is probably a positive sentence with a ${sentiment_score} % sentiment score.`;
    } else {
      resultText = resultText = `This is probably a negative sentence with a ${sentiment_score} % sentiment score.`;
    }

    // Render result of translation to translate_url_test
    res.render("sentiment", {
      result: resultText,
      sentiment_text: sentiment_text
    });
  }
});
