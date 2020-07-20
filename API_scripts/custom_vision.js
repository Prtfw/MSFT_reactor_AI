// load env var
require("dotenv").config({ path: "./../.env" });

// util module
const util = require("util");

// Filesystem module
const fs = require("fs");

//* load env vars ---------------------------------------------------------------------------------

// Custom vision key
const training_key = process.env.training_key;

// Custom vision key
const prediction_key = process.env.prediction_key;

// Custom vision key
const prediction_resource_id = process.env.prediction_resource_id;

/*CUSTOM VISION API**********************************************************************************************/

// Custom vision endpoint
custom_vision_endpoint = "https://eastus.api.cognitive.microsoft.com/";

const TrainingApi = require("@azure/cognitiveservices-customvision-training");
const PredictionApi = require("@azure/cognitiveservices-customvision-prediction");
const msRest = require("@azure/ms-rest-js");
const { resolveNaptr } = require("dns");

const setTimeoutPromise = util.promisify(setTimeout);

// Keys
const trainingKey = training_key;
const predictionKey = prediction_key;
const predictionResourceId = prediction_resource_id;

// Root where images are stored
const sampleDataRoot = "path to your data file";

// Custom vision endpoint
const endPoint = custom_vision_endpoint;

const credentials = new msRest.ApiKeyCredentials({
  inHeader: { "Training-key": trainingKey }
});
const trainer = new TrainingApi.TrainingAPIClient(credentials, endPoint);

// Prediction model **********************************************************************************
const publishIterationName = "classifyModel";

try {
  (async () => {
    console.log("Creating project...");

    // Set project name
    const sampleProject = await trainer.createProject("Project Custom Vision");

    console.log("Sample project ID: ", sampleProject.id);

    module.exports = { sampleProject };

    // Create tag names
    const cruiseTag = await trainer.createTag(sampleProject.id, "cruise");
    const otherTag = await trainer.createTag(sampleProject.id, "other");

    console.log("Adding images...");
    let fileUploadPromises = [];

    const cruiseDir = `${sampleDataRoot}/cruise`;
    const cruiseFiles = fs.readdirSync(cruiseDir);
    cruiseFiles.forEach(file => {
      fileUploadPromises.push(
        trainer.createImagesFromData(
          sampleProject.id,
          fs.readFileSync(`${cruiseDir}/${file}`),
          { tagIds: [cruiseTag.id] }
        )
      );
    });

    const otherDir = `${sampleDataRoot}/other`;
    const otherFiles = fs.readdirSync(otherDir);
    otherFiles.forEach(file => {
      fileUploadPromises.push(
        trainer.createImagesFromData(
          sampleProject.id,
          fs.readFileSync(`${otherDir}/${file}`),
          { tagIds: [otherTag.id] }
        )
      );
    });

    await Promise.all(fileUploadPromises);

    console.log("Training...");
    let trainingIteration = await trainer.trainProject(sampleProject.id);

    // Wait for training to complete
    console.log("Training started...");
    while (trainingIteration.status == "Training") {
      console.log("Training status: " + trainingIteration.status);
      await setTimeoutPromise(1000, null);
      trainingIteration = await trainer.getIteration(
        sampleProject.id,
        trainingIteration.id
      );
    }
    console.log("Training status: " + trainingIteration.status);

    // Publish the iteration to the end point
    await trainer.publishIteration(
      sampleProject.id,
      trainingIteration.id,
      publishIterationName,
      predictionResourceId
    );
  })();
} catch (err) {
  console.log(`Something went wrong: ${err}`);
}
