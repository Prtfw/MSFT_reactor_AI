// Add request
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

const sentimentKey = process.env.sentiment_key;

const baseUrl = process.env.base_url;

const sentimentBaseUrl = process.env.sentiment_url;

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
//const azure_base_url = 'https://maddogtest.cognitiveservices.azure.com/'
const azure_base_url = baseUrl; //'https://maddogcv.cognitiveservices.azure.com/'

// Computer Vision API
const analyzeEndpoint = azure_base_url + "/vision/v3.0/analyze";

// Cognitive API for Translator Text
const translatorTextUrl =
  "https://api.cognitive.microsofttranslator.com/" +
  "/translate?api-version=3.0";

// Translation API
let translationUrl = "https://api.cognitive.microsofttranslator.com/";

// Sentiment API
const sentimentUrl = sentimentBaseUrl + "text/analytics/v2.1/sentiment";

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
const translationParams = targetLanguage => {
  // Params needed for translation API call
  const params = {
    "api-version": "3.0",
    to: [targetLanguage]
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

app.get("/custom_vision_url", function(req, res) {
  res.render("custom_vision_url", { result: "", web_url: imageFile });
  console.log("GET CUSTOM VISION URL");
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

  // Function to extract text from image
  const extractTextFromImage = async (endpoint, body) => {
    // POST API call
    const postResponse = await fetch(endpoint, {
        method: "POST",
        params: {
          visualFeatures: "Categories,Description,Color",
          details: "",
          language: "en"
        },
        headers: blobHeaders,
        body: body
      }),
      // Get response headers
      responseHeaders = postResponse.headers.get(
        "Operation-Location",
        blobHeaders
      );

    result = {};

    while (true) {
      // Add response headers
      const getResponse = await fetch(responseHeaders, {
        method: "GET",
        headers: blobHeaders,
        location: "Operation-Location"
      });

      result = await getResponse.json();

      if ("analyzeResult" in result) {
        break;
      }

      if ("status" in result && result.status == "failed") {
        break;
      }
    }

    let result = result.analyzeResult.readResults[0].lines;

    // List for extracted text
    let extractedTextList = [];

    // Loop through result and add to list
    for (let i in result) {
      words = result[i].text;
      words = words.toLowerCase();
      extractedTextList.push(words);
    }
    extractedTextList = extractedTextList.join(" ");
    extractedTextList = JSON.stringify(extractedTextList);

    // Return the extracted text
    return extractedTextList;
  };

  // Function translated result
  const translateResult = async extractedText => {
    // Process the url for translation API call
    url = processUrl(translatorTextUrl, translationParams(targetLanguage));

    const translationResponse = await fetch(url, {
      method: "POST",
      baseUrl: translationUrl,
      url: "translate",
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

    // Add variable to return
    let result;

    // Result with translated text
    const translateResult = await translationResponse.json();

    // True or false for result
    let translationScore = translateResult[0].detectedLanguage.score;

    if (translationScore == 1) {
      // Extract text with translated lines from translateResult
      result = translateResult[0].translations[0].text;
      return result;
    }

    if (translationScore == 0) {
      let result = "Could not find any text to translate in the picture. ";
      return result;
    }
  };

  // Save the extracted text from the result
  let extractedText = await extractTextFromImage(textRecognitionUrl, body);

  // Add extracted_text to translate function and save result
  let result = await translateResult(extractedText);

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

  // Function to extract text from image
  const extractTextFromImage = async (json, endpoint, jsonHeaders) => {
    // If no image url is pasted
    if (webUrl == "") {
      webUrl = "/static/placeholder.png";
      res.render("translate_url", {
        target_language_dictionary: targetLanguageDictionary,
        result: "Please add an image URL in the input field",
        web_url: webUrl
      });
    } else {
      console.log("IN ELSE");
      console.log("WEB URL", webUrl);

      // POST API call
      const postResponse = await fetch(endpoint, {
          method: "POST",
          headers: jsonHeaders,
          body: JSON.stringify({ url: json })
        }),
        // Save response headers in varaible
        responseHeaders = postResponse.headers.get(
          "Operation-Location",
          jsonHeaders
        );

      let result = {};

      while (true) {
        // Add responseHeaders
        const getResponse = await fetch(responseHeaders, {
          method: "GET",
          headers: jsonHeaders,
          location: "Operation-Location"
        });

        result = await getResponse.json();

        if ("analyzeResult" in result) {
          break;
        }

        if ("status" in result && result.status == "failed") {
          break;
        }
      }

      result = result.analyzeResult.readResults[0].lines;

      // List to add extracted text
      let extractedTextList = [];

      // Loop through result and add to list
      for (let i in result) {
        words = result[i].text;
        words = words.toLowerCase();
        extractedTextList.push(words);
      }
      extractedTextList = extractedTextList.join(" ");
      extractedTextList = JSON.stringify(extractedTextList);

      // Return the extracted text
      return extractedTextList;
    }
  };

  // Function translated result
  const translateResult = async extractedText => {
    // Process the url for translation API call
    url = processUrl(translatorTextUrl, translationParams(targetLanguage));

    const translationResponse = await fetch(url, {
      method: "POST",
      baseUrl: translationUrl,
      url: "translate",
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

    // Add variable to return
    let result;

    // Result with translated text
    const translateResult = await translationResponse.json();

    // True or false for result
    let translationScore = translateResult[0].detectedLanguage.score;

    if (translationScore == 1) {
      // Extract text with translated lines from translateResult
      result = translateResult[0].translations[0].text;
      return result;
    }

    if (translationScore == 0) {
      let result = "Could not find any text to translate in the picture. ";
      return result;
    }
  };

  // Save the extracted text from the result
  let extractedText = await extractTextFromImage(
    webUrl,
    textRecognitionUrl,
    jsonHeaders
  );

  // Add extracted_text to translate function and save result
  let result = await translateResult(extractedText);

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

  // POST API call
  const processLandmark = async webUrl => {
    if (webUrl == "") {
      webUrl = "/static/placeholder.png";
      res.render("landmark_url", {
        result: "Please add an image URL in the input field",
        webUrl: webUrl
      });
    } else {
      // Process URL
      url = processUrl(analyzeEndpoint, landmarkParams);

      // If landmark is found
      try {
        const response = await fetch(url, {
            method: "POST",
            headers: jsonHeaders,
            body: JSON.stringify({ url: webUrl })
          }),
          // Landmark result
          landmarkResult = await response.json();

        // Filter the landmark name from landmarkResult
        let result = landmarkResult.categories[0].detail.landmarks[0].name;

        return result;
      } catch (error) {
        // Catch error and no detected landmarks
        let result = "Could not find a result for this image";
        return result;
      }
    }
  };

  // Result
  result = await processLandmark(webUrl);

  // Render result to view
  res.render("landmark_url", { result: result, web_url: webUrl });
});

/*LANDMARK UPLOAD API**********************************************************************************************/

app.post("/landmark_upload", upload, async (req, res) => {
  // Path to uploaded image
  let imagePath = req.file.path;

  // Process image to binary
  let body = imageToBinary(imagePath);

  const processLandmark = async body => {
    // Process URL
    url = processUrl(analyzeEndpoint, landmarkParams);

    // If landmark is found
    try {
      const response = await fetch(url, {
          method: "POST",
          headers: blobHeaders,
          body: body
        }),
        // Translate result
        landmarkResult = await response.json();

      let result = landmarkResult.categories[0].detail.landmarks[0].name;

      return result;
    } catch (error) {
      // Catch error and no detected landmarks
      let result = "Could not find a result for this image";

      return result;
    }
  };

  // Result
  result = await processLandmark(body);

  // Render result to view
  res.render("landmark_upload", {
    result: result,
    image_file: `uploads/${req.file.filename}`
  });
});

/*OBJECT DETECT UPLOAD API**********************************************************************************************/

// Object detection image url
app.post("/object_detect_url", async (req, res) => {
  // Url pasted to the view
  webUrl = req.body.web_url;

  // Object detection API call
  const processObjectDetection = async webUrl => {
    // If there is no url pasted to the field
    if (webUrl == "") {
      webUrl = "/static/placeholder.png";
      res.render("object_detect_url", {
        result: "Please add an image URL in the input field",
        web_url: webUrl
      });
    } else {
      // Process URL
      url = processUrl(analyzeEndpoint, objectDetectionParams);

      // If object is found
      try {
        const response = await fetch(url, {
            method: "POST",
            headers: jsonHeaders,
            body: JSON.stringify({ url: webUrl })
          }),
          // Object detection result
          responseResult = await response.json();

        console.log("RESULT: ", responseResult);

        // List to add all objects from result
        result = [];
        resultObjects = responseResult.objects;

        // Filter out all objects and add to list
        for (i = 0; i < resultObjects.length; i++) {
          object = resultObjects[i].object;
          result.push(object.toUpperCase());
        }

        return result;
      } catch (error) {
        // Catch error and no detected objects
        let result = "Could not find a result for this image";

        return result;
      }
    }
  };

  // Result
  let result = await processObjectDetection(webUrl);

  // Render result to page
  res.render("object_detect_url", { result: result, web_url: webUrl });
});

//****************************************************************************************************************************/
// Object detection upload image

app.post("/object_detect_upload", upload, async (req, res) => {
  // Path to uploaded image
  let imagePath = req.file.path;

  // Object detection API call
  const processObjectDetection = async imagePath => {
    // Process image to binary
    let body = imageToBinary(imagePath);

    // Process URL
    url = processUrl(analyzeEndpoint, objectDetectionParams);

    // If object is found
    try {
      const response = await fetch(url, {
          method: "POST",
          headers: blobHeaders,
          body: body
        }),
        // Object detection result
        responseResult = await response.json();
      console.log("RESULT: ", responseResult);

      // List to add all objects from result
      result = [];
      resultObjects = responseResult.objects;

      // Filter out all objects and add to list
      for (i = 0; i < resultObjects.length; i++) {
        object = resultObjects[i].object;
        result.push(object.toUpperCase());
      }

      // If no objects detected
      if (result == undefined || result.length == 0) {
        result = "No objects detected";
      }
      return result;
    } catch (error) {
      // Catch error
      result = "Could not find a result for this image";

      return result;
    }
  };

  let result = await processObjectDetection(imagePath);

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

  const processTranslation = async sentimentText => {
    if (sentimentText == "") {
      res.render("sentiment", {
        result: "Please add text. ",
        sentiment_text: sentimentText
      });
    } else {
      // Text to JSON
      sentimentText = JSON.stringify(sentimentText);

      // Process url
      url = processUrl(translatorTextUrl, translationParams("en"));

      const response = await fetch(url, {
        method: "POST",
        baseUrl: translationUrl,
        url: "translate",
        headers: {
          "Ocp-Apim-Subscription-Key": translateKey,
          "Ocp-Apim-Subscription-Region": "australiaeast",
          "Content-type": "application/json",
          "X-ClientTraceId": uuidv4().toString()
        },
        body: JSON.stringify([
          {
            text: sentimentText
          }
        ])
      });

      // Translate result
      const translateResult = await response.json();
      console.log("Translate result: ", translateResult);

      try {
        let result = "";

        // Extract text with translated lines from translate_result
        resultText = translateResult[0].translations[0].text;

        // Replace characters with plain text for output
        result = resultText
          .replace("[", "")
          .replace("]", "")
          .replace('"', "")
          .replace('"', "")
          .replace(",", "")
          .replace('"', "")
          .replace('"', "");

        return result;
      } catch (error) {
        result = `Received error: ${error}.`;
        return result;
      }
    }
  };

  const processSentiment = async translateText => {
    // Sentiment API
    const response = await fetch(sentimentUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": sentimentKey,
        "Content-type": "application/json",
        "Ocp-Apim-Subscription-Region": "australiaeast",
        "X-ClientTraceId": "35ddc2ff-b916-43b0-a09f-1ee18fe8f0df" //uuidv4().toString()
      },
      body: JSON.stringify({
        documents: [{ id: "1", language: "en", text: translateText }]
      })
    });

    const sentimentResult = await response.json();

    try {
      let result = "";

      sentimentScore = sentimentResult.documents[0].score.toFixed(2) * 100;

      if (sentimentScore >= 50) {
        result = `This is probably a positive sentence with a ${sentimentScore} % sentiment score.`;

        return Promise.resolve(result);
      } else {
        result = `This is probably a negative sentence with a ${sentimentScore} % sentiment score.`;

        return result;
      }
    } catch (err) {
      return err;
    }
  };

  // Translate text to English
  let translateText = await processTranslation(sentimentText);

  // Return sentiment result
  let result = await processSentiment(translateText);

  // Render result of translation to translate_url_test
  res.render("sentiment", { result: result, sentiment_text: sentimentText });
});

/*CUSTOM VISION URL API**********************************************************************************************/

// Custom Vision image url API call
app.post("/custom_vision_url", async (req, res) => {
  webUrl = req.body.web_url;
  console.log("WEB URL: ", webUrl);

  const processCustomVision = async webUrl => {
    // If no url is added
    if (webUrl == "") {
      webUrl = "/static/placeholder.png";

      result = "Please add an image URL in the input field";

      res.render("custom_vision_url", {
        result: "Please add an image URL in the input field",
        web_url: webUrl
      });
    } else {
      // Create filename for folder
      let randomFilename = Math.floor(Math.random() * 101);
      randomFilename = randomFilename.toString();

      // Image path
      const imagePath = "./public/uploads/" + randomFilename + ".png";

      // Download image to folder
      downloadImage(webUrl, imagePath, () => {
        console.log("Image downloaded at: ", imagePath);

        try {
          (async () => {
            // Predictor API
            const predictorCredentials = new msRest.ApiKeyCredentials({
              inHeader: { "Prediction-key": predictionKey }
            });
            const predictor = new PredictionApi.PredictionAPIClient(
              predictorCredentials,
              endPoint
            );

            // Uploaded image
            const publicImageFolderRoot = "./public/uploads/";
            const uploadedImage = fs.readFileSync(
              `${publicImageFolderRoot}/${randomFilename}.png`
            );

            const results = await predictor.classifyImage(
              sampleProjectID,
              publishIterationName,
              uploadedImage
            );

            // Results
            console.log("Results:");

            // List to push results
            messages = [];

            // Predictions from your model
            results.predictions.forEach(predictedResult => {
              console.log(
                `\t ${predictedResult.tagName}: ${(
                  predictedResult.probability * 100.0
                ).toFixed(2)}%`
              );
              messages.push(
                `\t ${predictedResult.tagName}: ${(
                  predictedResult.probability * 100.0
                ).toFixed(2)}%`
              );
            });

            // Render results to view
            res.render("custom_vision_url", {
              result: messages,
              web_url: webUrl
            });
          })();
        } catch (err) {
          messages = `Something went wrong: ${err}`;

          res.render("custom_vision_url", {
            result: messages,
            web_url: webUrl
          });
        }
      });
    }
  };

  // Call function and use custom vision
  await processCustomVision(webUrl);
});
