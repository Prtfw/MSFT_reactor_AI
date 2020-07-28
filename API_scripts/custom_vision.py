import os
import time

# Load system variables with dotenv
from dotenv import load_dotenv
load_dotenv()

# Load keys and urls

# Primary key
_key = os.environ["_key"]

#Translator key
translate_key = os.environ["translate_key"]

# Key sentiment
_sentiment_key = os.environ["sentiment_key"]

_base_url = os.environ["base_url"]

_sentiment_url = os.environ["sentiment_url"]

# Custom vision key
training_key = os.environ["training_key"]

# Custom vision key
prediction_key = os.environ["prediction_key"]

# Custom vision key
prediction_resource_id = os.environ["prediction_resource_id"]

COGSVCS_CLIENTURL = _base_url
COGSVCS_KEY = _key
COGSVCS_REGION = 'eastus'

# Create vision_client
from msrest.authentication import CognitiveServicesCredentials
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import ComputerVisionErrorException


# Create the Custom Vision project
from azure.cognitiveservices.vision.customvision.training import CustomVisionTrainingClient
from azure.cognitiveservices.vision.customvision.training.models import ImageFileCreateBatch, ImageFileCreateEntry
from azure.cognitiveservices.vision.customvision.prediction import CustomVisionPredictionClient
from msrest.authentication import ApiKeyCredentials

# Custom vision endpoint
custom_vision_endpoint = "https://eastus.api.cognitive.microsoft.com/"


vision_credentials = CognitiveServicesCredentials(COGSVCS_KEY)
vision_client = ComputerVisionClient(COGSVCS_CLIENTURL, vision_credentials)

person_group_id = 'reactor'


publish_iteration_name = "classifyModel"

credentials = ApiKeyCredentials(in_headers={"Training-key": training_key})
trainer = CustomVisionTrainingClient(custom_vision_endpoint, credentials)

# Create a new project
print ("Creating project...")
project = trainer.create_project("CV Project")

# Make two tags in the new project
cruise = trainer.create_tag(project.id, "cruise")
other = trainer.create_tag(project.id, "other")

# Add the base path to the downloaded image files
base_image_url = ""

print("Adding images...")

# Image list to save images
image_list = []

 # Add path in from the base_image_url where you have the cruise ship images folder
directory = os.fsencode(base_image_url+"cruise/")

# Loop through image file folder
for file in os.listdir(directory):

    file_name = os.fsdecode(file)
    print("FILE NAME cruise: ", file_name)
    with open(base_image_url + "cruise/" + file_name, "rb") as image_contents:
        image_list.append(ImageFileCreateEntry(name=file_name, contents=image_contents.read(), tag_ids=[cruise.id]))


# Add path in from the base_image_url where you have the other images folder
directory = os.fsencode(base_image_url+"other/")


# Loop through image file folder
for file in os.listdir(directory):
    file_name = os.fsdecode(file)
    print("FILE NAME other", file_name)
    with open(base_image_url +"other/" + file_name, "rb") as image_contents:
        image_list.append(ImageFileCreateEntry(name=file_name, contents=image_contents.read(), tag_ids=[other.id]))


# Upload images with tags
upload_result = trainer.create_images_from_files(project.id, ImageFileCreateBatch(images=image_list))
if not upload_result.is_batch_successful:
    print("Image batch upload failed.")
    for image in upload_result.images:
        print("Image status: ", image.status, file_name)
    exit(-1)


# Start training
print ("Training...")
iteration = trainer.train_project(project.id)
while (iteration.status != "Completed"):
    iteration = trainer.get_iteration(project.id, iteration.id)
    print ("Training status: " + iteration.status)
    time.sleep(1)


# Publish the trainer
trainer.publish_iteration(project.id, iteration.id, publish_iteration_name, prediction_resource_id)
print ("Done!")

print("Project ID", project.id)
