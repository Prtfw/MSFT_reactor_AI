import os, base64, json, requests
from flask import Flask, render_template, request

# Load system variables with dotenv
from dotenv import load_dotenv
from dotenv import load_dotenv
load_dotenv()

import image_helper
import json as j
import uuid
import time

import operator
import numpy as np
import random
import datetime
from datetime import datetime

import matplotlib
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
from matplotlib.patches import Rectangle
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
from matplotlib.figure import Figure

from PIL import Image
from PIL import JpegImagePlugin
import io
from io import BytesIO


import pprint
from pprint import pprint

#---------------------------------------------------------------------------------------------------------------------#
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

# Project ID Custom Vision
project_id = os.environ["project_id"]


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

# Custom Vision project name
publish_iteration_name = "classifyModel"


vision_credentials = CognitiveServicesCredentials(COGSVCS_KEY)
vision_client = ComputerVisionClient(COGSVCS_CLIENTURL, vision_credentials)

person_group_id = 'reactor'

# Num retries for processRequest() function
_maxNumRetries = 10

# General headers
headers = {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': _key
    }


#---------------------------------------------------------------------------------------------------------------------#
# Endpoint dictionaries

# Cognitive API for Computer Vision
analyze_dict = {'computer_vision_API':
                    [{'url': _base_url + '/vision/v3.0/analyze',
                      '_key': _key,
                      'headers': headers,
                      'params': {'visualFeatures': 'Categories,Description,Color'}}]}

# Custom Vision API - Object Detection
detect_dict = {'object_detection_API':
                   [{'url': _base_url + 'vision/v3.0/detect',
                     '_key': _key,
                     'headers': headers,
                     'params': {'visualFeatures': 'Objects,Description'}}]}

# OCR API
text_recognition_dict = {'text_recognition_API':
                             [{'url': _base_url + '/vision/v3.0/read/analyze',
                               '_key': _key,
                               'headers': headers}]}

# Cognitive API for Translator Text
translator_dict = {'translator_text_API':
                       [{'url': 'https://api.cognitive.microsofttranslator.com/' + '/translate?api-version=3.0',
                         '_key': translate_key,
                         'headers': {
                             'Content-Type': 'application/json',
                             'Ocp-Apim-Subscription-Key': translate_key,
                             'Ocp-Apim-Subscription-Region': 'eastus',
                             'X-ClientTraceId': str(uuid.uuid4())
                         }}]}

# Cognitive API for Text Analytics
sentiment_dict = {'sentiment_analytics_API':
                      [{
                           'url': _sentiment_url + '/text/analytics/v2.1/sentiment',
                           '_key': _sentiment_key,
                           'headers': {
                               'Content-Type': 'application/json',
                               'Ocp-Apim-Subscription-Key': _sentiment_key,
                               'Ocp-Apim-Subscription-Region': 'eastus',
                               'X-ClientTraceId': str(uuid.uuid4())
                           }}]}




#---------------------------------------------------------------------------------------------------------------------#
# Helper functions

# Helper class for image rendering
def get_image(request):
    # Helper class
    from image_helper import Image
    if request.files:
        if(request.files["file"]):
            return Image(request.files["file"])
    else:
        return Image()



# Display image from URL with resul text
def render_image(result_title, image_url):

  """Display the obtained results onto the input image"""

  image = Image.open(BytesIO(requests.get(image_url).content))

  fig, ax = plt.subplots(figsize=(4, 4), dpi=300)

  ax.imshow( image )

  plt.title(result_title, fontsize=8, va="center", color='r', weight='heavy')

  plt.axis('off')

  plt.savefig('static/' + result_title)

  image.close()


# Display image from uploaded image with result text
def render_upload_image(result_title, image_blob):

    image = Image.open(image_blob)

    fig, ax = plt.subplots(figsize=(4, 4), dpi=300)

    ax.imshow( image )

    plt.title(result_title, fontsize=8, va="center", color='r', weight='heavy')

    plt.axis('off')

    plt.savefig('static/' + result_title)

    image.close()


# Does not work properly
def render_translation_url(result_title, image_url, target_language):

    image = Image.open(BytesIO(requests.get(image_url).content))

    fig, ax = plt.subplots(figsize=(4, 4), dpi=300)

    ax.imshow( image )

    plt.title(result_title, fontsize=30, va="center", color='r', weight='heavy')

    plt.axis('off')

    plt.savefig('static/' + target_language)

    image.close()


# Function to render extracted text
def render_extracted_text(result, image):

    polygons = []

    if ("analyzeResult" in result):
        # Extract the recognized text, with bounding boxes.
        polygons = [(line["boundingBox"], line["text"])
        for line in result["analyzeResult"]["readResults"][0]["lines"]]


    image = Image.open(BytesIO(requests.get(image).content))

    fig, ax = plt.subplots(figsize=(15, 20))
    ax.imshow( image )


    for polygon in polygons:
        vertices = [(polygon[0][i], polygon[0][i+1])
                    for i in range(0, len(polygon[0]), 2)]

        text = polygon[1]
        patch = Polygon(vertices, closed=True, fill=False, linewidth=2, color='y')
        ax.axes.add_patch(patch)
        plt.text(vertices[0][0], vertices[0][1], text, fontsize=24, va="center", color='r', weight='heavy',
                family='monospace', rotation=25)

    plt.axis('off')

    plt.savefig('static/' + 'translation')


def render_object_image(result_title, image_url, image_title):

  """Display the obtained results onto the input image"""

  image = Image.open(BytesIO(requests.get(image_url).content))

  fig, ax = plt.subplots(figsize=(4, 4), dpi=300)

  ax.imshow( image )

  plt.title(result_title, fontsize=8, va="center", color='r', weight='heavy')

  plt.axis('off')

  plt.savefig('static/' + image_title)


def render_object_detection(detection_result, image_url, image_title):

    image = Image.open(BytesIO(requests.get(image_url).content))
    fig, ax = plt.subplots(figsize=(4,4), dpi=300)

    ax.imshow(image, alpha=0.6)

    for i in detection_result['objects']:
        fr = i["rectangle"]
        fa = i["object"]
        origin = (fr["x"], fr["y"])

        rectangle = matplotlib.patches.Rectangle(origin, fr["w"],
                                fr["h"], fill=False, linewidth=2, color='b')

        ax.axes.add_patch(rectangle)
        ax.text(origin[0], origin[1], "%s"%(fa),
                    fontsize=10, weight="bold", va="bottom")

        ax.axis("off")

        plt.savefig('static/' + image_title)


def render_object_detection_upload(detection_result, image_blob):

    image = Image.open(image_blob)
    fig, ax = plt.subplots(figsize=(4,4), dpi=300)
    dt_string = ''

    ax.imshow(image, alpha=0.6)

    # Plot detected results on image
    for i in detection_result['objects']:
        fr = i["rectangle"]
        fa = i["object"]
        origin = (fr["x"], fr["y"])

        rectangle = matplotlib.patches.Rectangle(origin, fr["w"],
                                fr["h"], fill=False, linewidth=2, color='b')

        ax.axes.add_patch(rectangle)
        ax.text(origin[0], origin[1], "%s"%(fa),
                    fontsize=10, weight="bold", va="bottom")

        ax.axis("off")



        # Current date now
        now = datetime.now()

        # Save file as date and time now to keep it unique
        image_filename = now.strftime("%d_%m_%Y%H_%M_%S")

        # Save the image to the static folder
        plt.savefig('static/' + image_filename)

    # Return the filename
    return image_filename

def custom_vision_render_image_url(image_filename, image_url):

    image = Image.open(BytesIO(requests.get(image_url).content))

    fig, ax = plt.subplots(figsize=(4, 4), dpi=300)

    ax.imshow( image )

    plt.axis('off')

    plt.savefig('static/' + image_filename)

#---------------------------------------------------------------------------------------------------------------------#
# Init application

# Create the application
app = Flask(__name__)


#---------------------------------------------------------------------------------------------------------------------#
# GET routes

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


#---------------------------------------------------------------------------------------------------------------------#
# Translate API

@app.route("/translate_upload", methods=["GET", "POST"])


def translate():

    """Hint translate function

    - TODO: Create a function named extract_text_from_image_upload()
        1. 2 parameters: image, client
        2. The function should return the extracted text lines from the image
        3. Save returned text in the list messages

    - TODO: Create a function named translate_text_upload()
        1. 4 parameters: lines, target_language, key, region
        2. The function should return the translated lines
        3. Save returned lines in the list messages

    """
    # Load image or placeholder
    image = get_image(request)

    # Set the default for language translation
    target_language = "en"
    if request.form and "target_language" in request.form:
        target_language = request.form["target_language"]


    # If it"s a GET, just return the form
    if request.method == "GET":
        return render_template("translate_upload.html", image_uri=image.uri,  target_language=target_language)


    """ TODO: Create a function named extract_text_from_image_upload() that takes 2 parameters: image, client
        The function should return the extracted text lines from the image
        Save returned text in the list lines below
    """
    ## Create a placeholder for extracted text lines
    lines = []


    """ TODO: Create a function named translate_text_upload() that takes 2 parameters: lines, target_language, key, region
        The function should return the translated lines
        Save returned lines in the list messages
    """
    ## Create a placeholder for messages
    messages = []

    # BONUS: Add try/except to catch errors


    # Render template
    return render_template("translate_upload.html", image_uri=image.uri, target_language=target_language, messages=messages)



#---------------------------------------------------------------------------------------------------------------------#

@app.route("/translate_url", methods=["GET", "POST"])

def translate_image_url():


    """Hint translate_image_url()

    - TODO: Write a function named extract_text_from_image().
            1. 4 parameters: _url, headers, json, data
            2. Return the extracted text and save it in the variable result

    - TODO: Loop through result and save results with text lines in result_list,
      use result['analyzeResult']['readResults'][0]['lines'] and then append i['text']

    - TODO: Write a function named translate_text_url().
            1. 4 parameters: _translate_key, params, data, json
            2. Return the translation and save it in result_list

    - TODO: Loop through result_list and append translated text to messages,
      use result_list[0]['translations'], append i['text']

    """

    image = get_image(request)

   # Set the default for language translation
    target_language = 'en'
    web_url = ''


    ### IMPORTANT ###
    # Add if URL text box is empty do not call the API
    if request.form and ("target_language" in request.form or "web_url" in request.form):
        target_language = request.form["target_language"]
        web_url = request.form["web_url"]

    # If it"s a GET, just return the form
    if request.method == "GET":
        return render_template("translate_url.html", image_uri=image.uri, target_language=target_language, web_url=web_url)

    # If field is not empty
    if(web_url is not ''):
        json = { 'url': web_url }
        data = None

        """ TODO: Write a function named extract_text_from_image().
            1. 4 parameters: _url, headers, json, data
            2. Return the extracted text and save it in the variable result
        """
        result = ''

        # TODO: Loop through result and save results with text lines in result_list
        # Use result['analyzeResult']['readResults'][0]['lines'] and then append i['text']
        result_list = []
        # Add for loop here

        # Parameters with target language
        params = '&to='+target_language

        # Convert result to json
        convert_to_json = j.dumps(result_list)

        # Add converted result to body
        body = [{'text': convert_to_json}]

        """ TODO: Write a function named translate_text_url().
            1. 4 parameters: _translate_key, params, data, json
            2. Return the translation and save it in result_list
        """
        result_list = ''


        # Loop through result_list and append translated text to messages
        # Use: Loop result_list[0]['translations'], append i['text']
        messages = []
        # Add for loop here

        # Render template with translation
        return render_template("translate_url.html", image_uri=web_url, target_language=target_language, messages=messages)


    else:
        messages = 'This is empty!'
        return render_template("translate_url.html", image_uri=web_url, target_language=target_language, messages=messages)


#---------------------------------------------------------------------------------------------------------------------#
# Computer Vision API (landmark detection)

# TODO: Add the function processRequest() here

#-------------------------------------------------------------------------------------------------------------------------------------------#

# GET and POST to landmark image URL (Computer Vision API)
@app.route("/landmark_url", methods=["GET", "POST"])


def landmark_image_url():

    """Hint landmark_image_url()
    - TODO: Write a function named processRequest.
                      1. 5 parameters: analyze_dict['computer_vision_API'][0]['url'], json, data, analyze_dict['computer_vision_API'][0]['headers'],
                        analyze_dict['computer_vision_API'][0]['params']
                      2. Function should process the request and send back the result from the response
                      3. BONUS: Add this function so it can be called from other API's as well, see above @app.route("/landmark_url", methods=["GET", "POST"])
                      4. Save the result in analyze_result
    - TODO: Extract only the landmark name from the result: [analyze_result['categories'][0]["detail"]['landmarks'][0]['name']]

    """


    image = get_image(request)

   # Image URL to detect landmark
    landmark_url = ''

     # Create a placeholder for messages
    messages = []


    ### IMPORTANT ###
    # Add if URL text box is empty do not call the API
    if request.form and ("landmark_url" in request.form):
        landmark_url = request.form["landmark_url"]

    # If it"s a GET, just return the form
    if request.method == "GET":
        return render_template("landmark_url.html", image_uri=image.uri, landmark_url=landmark_url)

    if(landmark_url is not ''):
            #print("NOT EMPTY", landmark_url)
            json = { 'url': landmark_url }
            data = None

            """ TODO: Write a function named processRequest.
                      1. 5 parameters: analyze_dict['computer_vision_API'][0]['url'], json, data, analyze_dict['computer_vision_API'][0]['headers'],
                        analyze_dict['computer_vision_API'][0]['params']
                      2. Function should process the request and send back the result from the response
                      3. BONUS: Add this function so it can be called from other API's as well, see above @app.route("/landmark_url", methods=["GET", "POST"])
                      4. Save the result in analyze_result
            """

            analyze_result = ''


#-------------------------------------------------------------------------------------------------------------------------------------------#
# Landmark request

            # If landmark detected
            try:

                if ( analyze_result['categories'][0]["detail"]['landmarks'][0]['name'] ):

                    #analyze_result_text = analyze_result['categories'][0]["detail"]['landmarks'][0]['name']
                    print("Analyse result text below: ", analyze_result['categories'][0]["detail"]['landmarks'][0]['name'])


                    # TODO: Extract only the landmark name from the result: [analyze_result['categories'][0]["detail"]['landmarks'][0]['name']]
                    messages = []

                    # Render image with result text
                    render_url_test = render_image(analyze_result['categories'][0]["detail"]['landmarks'][0]['name'], landmark_url)
                    saved_landmark_image = "/static/" + analyze_result['categories'][0]["detail"]['landmarks'][0]['name'] + ".png"
                    return render_template("landmark_url.html", image_uri= saved_landmark_image, messages=messages)

            except:

                try:

                    if(analyze_result['categories'][0]):

                        tags = []

                        for i in analyze_result['description']['tags']:

                            tags.append(i.upper() + '\n')


                    messages = ["No landmark detected. Objects detected:  ", tags]
                    return render_template("landmark_url.html", image_uri= landmark_url, messages=messages)

                except:

                    try:
                        if( analyze_result['description']['tags'][0] ):
                            messages = ["No landmark detected.", ['description']['tags'][0]]
                            print( analyze_result['categories'] )
                            return render_template("landmark_url.html", image_uri= landmark_url, messages=messages)


                    except:
                        try:
                            if(analyze_result['categories'] == []):
                                print("No landmark detected.", analyze_result['description']['captions'][0]['text'])
                                messages = ["No landmark detected. Detected objects: ", analyze_result['description']['captions'][0]['text'] ]
                                return render_template("landmark_url.html", image_uri= landmark_url, messages=messages)
                        except:
                            print("Error")
                            messages = ['ERROR']
                            return render_template("landmark_url.html", image_uri=landmark_url, messages=messages)



    else:
        messages = ['Please enter an image URL']
        return render_template("landmark_url.html", image_uri=landmark_url, messages=messages)


#-------------------------------------------------------------------------------------------------------------------------------------------#

# GET and POST to landmark image upload (Computer Vision API)
@app.route("/landmark_upload", methods=["GET", "POST"])

def landmark_image_upload():

    """Hint landmark_image_url()
    - TODO: Call the function processRequest()
                      1. 5 parameters: analyze_dict['computer_vision_API'][0]['url'], json, data, landmark_upload_headers,
                        analyze_dict['computer_vision_API'][0]['params']
                      2. Function should process the request and send back the result from the response
                      3. Save the result in analyze_result

    - TODO: Extract only the landmark name from the result: [analyze_result['categories'][0]["detail"]['landmarks'][0]['name']]

    """

    landmark_upload_image = get_image(request)

     # Create a placeholder for messages
    messages = []

    ### IMPORTANT ###

    # If it"s a GET, just return the form
    if request.method == "GET":
        return render_template("landmark_upload.html", image_uri=landmark_upload_image.uri)

    json = None
    data = landmark_upload_image.blob

    # Landmark image upload headers
    landmark_upload_headers = {
    'Content-Type': 'application/octet-stream',
    'Ocp-Apim-Subscription-Key': _key
    }


    """ TODO: Call the function processRequest()
                1. 5 parameters: analyze_dict['computer_vision_API'][0]['url'], json, data, analyze_dict['computer_vision_API'][0]['headers'],
                        analyze_dict['computer_vision_API'][0]['params']
                2. Function should process the request and send back the result from the response
                3. Save the result in analyze_result
    """


    analyze_result = ''


    # If landmark detected
    try:


        if ( analyze_result['categories'][0]["detail"]['landmarks'][0]['name'] ):

            # TODO: Extract only the landmark name from the result: [analyze_result['categories'][0]["detail"]['landmarks'][0]['name']]
            messages = []

            # Render image with result text
            render_url_test = render_upload_image(analyze_result['categories'][0]["detail"]['landmarks'][0]['name'], landmark_upload_image.blob)
            saved_landmark_image = "/static/" + analyze_result['categories'][0]["detail"]['landmarks'][0]['name'] + ".png"
            return render_template("landmark_upload.html", image_uri= saved_landmark_image, messages=messages)

    except:
        try:

            if(analyze_result['categories'][0]):

                tags = []

                for i in analyze_result['description']['tags']:
                    tags.append(i.upper() + '\n')


                messages = ["No landmark detected. Objects detected:  ", tags]
                return render_template("landmark_upload.html", image_uri= landmark_upload_image.uri, messages=messages)

        except:


            try:

                if( analyze_result['description']['tags'][0] ):
                    messages = ["No landmark detected.", ['description']['tags'][0]]
                    return render_template("landmark_upload.html", image_uri= landmark_upload_image.uri, messages=messages)


            except:

                try:

                    if(analyze_result['categories'] == []):

                        messages = ["No landmark detected. Detected objects: ", analyze_result['description']['captions'][0]['text'] ]
                        return render_template("landmark_upload.html", image_uri= landmark_upload_image.uri, messages=messages)
                except:

                    messages = ['ERROR']
                    return render_template("landmark_upload.html", image_uri=landmark_upload_image.uri, messages=messages)

#-------------------------------------------------------------------------------------------------------------------------------------------#
# Object Detection API

# GET and POST to landmark image URL (Computer Vision API)
@app.route("/object_detect_url", methods=["GET", "POST"])
def object_detect_url():

    """Hint object_detect_url()
    -TODO: Call the function processRequest()
                1. 5 parameters:
                        detect_dict['object_detection_API'][0]['url'],
                        detect_json,
                        data,
                        detect_dict['object_detection_API'][0]['headers'],
                        detect_dict['object_detection_API'][0]['params'] )
                2. Function should process the request and send back the result from the response
                3. Save the result in detection_result
    - TODO: Filter out all objects and add to detection_text_list
    - TODO: Add the detected objects from the detection_text_list to messages
    """


    image = get_image(request)

   # Image URL to detect objects
    web_url = ''

     # Create a placeholder for messages
    messages = []


    ### IMPORTANT ###
    # Add if URL text box is empty do not call the API
    if request.form and ("web_url" in request.form):
        web_url = request.form["web_url"]

    # If it"s a GET, just return the form
    if request.method == "GET":
        return render_template("object_detect_url.html", image_uri=image.uri, web_url=web_url)

    # If image url is not empty
    if(web_url is not ''):
            #print("NOT EMPTY", web_url)
            detect_json = { 'url': web_url }
            data = None

            """ TODO: Call the function processRequest()
                1. 5 parameters:
                        detect_dict['object_detection_API'][0]['url'],
                        detect_json,
                        data,
                        detect_dict['object_detection_API'][0]['headers'],
                        detect_dict['object_detection_API'][0]['params'] )
                2. Function should process the request and send back the result from the response
                3. Save the result in detection_result
            """

            detection_result = ''


            detection_text_list = []
            """ TODO: Filter out all objects and add to detection_text_list
                1. Loop through the detection_result['objects'] with a for loop
                2. Use i['object'] and append it to the list detection_text_list
                3. Add listToStr = ' '.join([str(elem) for elem in detection_text_list]) last in the loop

            """


            if(detection_text_list == []):
                messages = ["No objects detected. "]
                return render_template("object_detect_url.html", image_uri= web_url, messages=messages)

            else:
                print("Not empty.")


# Object detection request url

                try:
                    # TODO: Add the detected objects from the detection_text_list to messages
                    messages = []

                    render_object_detection(detection_result, web_url, detection_text_list[0])
                    saved_image = "/static/" + detection_text_list[0] + ".png"
                    return render_template("object_detect_url.html", image_uri= saved_image, messages=messages)



                except:
                    messages = ['Something went wrong.']
                    return render_template("object_detect_url.html", image_uri=web_url, messages=messages)

    else:
        messages = ['Please enter an image URL']
        return render_template("object_detect_url.html", image_uri=web_url, messages=messages)



#-------------------------------------------------------------------------------------------------------------------------------------------#
# GET and POST to object detection image upload (Object detection API)

@app.route("/object_detect_upload", methods=["GET", "POST"])

def object_detect_upload():

    """Hint object_detect_url()
    -TODO: Call the function processRequest()
                1. 5 parameters:
                        detect_dict['object_detection_API'][0]['url'],
                        detect_json,
                        data,
                        object_detect_upload_headers,
                        detect_dict['object_detection_API'][0]['params'] )
                2. Function should process the request and send back the result from the response
                3. Save the result in detection_result
    - TODO: Filter out all objects and add to detection_text_list
    - TODO: Add the detected objects from the detection_text_list to messages
    """

    detect_upload_image = get_image(request)

     # Create a placeholder for messages
    messages = []

    ### IMPORTANT ###

        # If it"s a GET, just return the form
    if request.method == "GET":
        return render_template("object_detect_upload.html", image_uri=detect_upload_image.uri)

    detect_json = None
    data = detect_upload_image.blob

    # Landmark image upload headers
    object_detect_upload_headers = {
    'Content-Type': 'application/octet-stream',
    'Ocp-Apim-Subscription-Key': _key
    }


    try:
        # Object detection result
        detection_result = ''

        detection_text_list = []
        """ TODO: Filter out all objects and add to detection_text_list
                1. Loop through the detection_result['objects'] with a for loop
                2. Use i['object'] and append it to the list detection_text_list
                3. Add listToStr = ' '.join([str(elem) for elem in detection_text_list]) last in the loop

        """


        if(detection_text_list == [] or detection_result == None):
            print("Empty")
            messages = ["No objects detected. "]
            return render_template("object_detect_upload.html", image_uri= detect_upload_image.uri, messages=messages)

        else:
            print("Detection list: ", detection_text_list[0])
            print("Not empty.")


    # Object detection request upload

            try:
                # TODO: Add the detected objects from the detection_text_list to messages
                messages = []

                image_filename = render_object_detection_upload(detection_result, detect_upload_image.blob)

                # Get saved image from static folder
                image_with_result = "/static/" + image_filename + ".png"
                return render_template("object_detect_upload.html", image_uri= image_with_result, messages=messages)



            except:
                messages = ['Something went wrong.']
                return render_template("object_detect_upload.html", image_uri=detect_upload_image.uri, messages=messages)

    except Exception as e:
        print("Exception", str(e))
        messages = ['Error. Could not use this image for object detection. ']
        return render_template("object_detect_upload.html", image_uri=detect_upload_image.uri, messages=messages)

#-------------------------------------------------------------------------------------------------------------------------------------------#
# Sentiment analysis

@app.route("/sentiment", methods=["GET", "POST"])

def sentiment():

    """Hint sentiment()
    - TODO: Write a method named process_translation()
            1. 1 parameter: sentiment_text
            2. Return translated result of sentiment_text
            3. Call the function at the end of sentiment() and save it to the variable translation

    -TODO: Write a method named sentiment_analysis()
           1. 2 parameters: sentiment_text
                            language (set to 'en')
           2. Make a post request and return response as json
           3. Call the function at the end of sentiment() and save it to the variable sentiment_result

    - TODO: Write a method named process_sentiment()
            1. 2 parameters: translation,
                             sentiment_result
            2. Return the sentiment score with sentiment_result['documents'][0]['score']

    """

   # Set the default for language translation
    sentiment_text = ''
    messages = []

    ### IMPORTANT ###
    # Add if URL text box is empty do not call the API

    if request.form and ("sentiment_text" in request.form):
        sentiment_text = request.form["sentiment_text"]

        # If it"s a GET, just return the form
    if request.method == "GET":
        return render_template("sentiment.html",sentiment_text=sentiment_text)


    # TODO: Method process_translation()
    translation = ''

    # TODO: Method sentiment_analysis()
    sentiment_result = ''

    # TODO: Method process_sentiment()
    messages = []

    # Render result of translation to translate_url_test
    return render_template("sentiment.html",  messages=messages)


#-------------------------------------------------------------------------------------------------------------------------------------------#
# Custom Vision Image Url


@app.route("/custom_vision_url", methods=["GET", "POST"])

def custom_vision_url():


    """Hint sentiment()
    - TODO: Add the folder you will download to image to images_folder

    - TODO: 1. Loop through results.predictions and
                          2. Append prediction.tag_name and prediction.probability to messages
                          3. Return messages.

    - TODO: Call process_custom_vision() and save to messages

    """

    image = get_image(request)

    custom_vision_url = ''

    ### IMPORTANT ###
    # Add if URL text box is empty do not call the API
    if request.form and ("custom_vision_url" in request.form):
        custom_vision_url = request.form["custom_vision_url"]
        print(49,'now call api with this img url', custom_vision_url)

    # If it"s a GET, just return the form
    if request.method == "GET":
        return render_template("custom_vision_url.html", image_uri=image.uri, custom_vision_url=custom_vision_url)


    def process_custom_vision(custom_vision_url):

        if(custom_vision_url is not ''):

            # Prediction API
            prediction_credentials = ApiKeyCredentials(in_headers={"Prediction-key": prediction_key})
            predictor = CustomVisionPredictionClient(custom_vision_endpoint, prediction_credentials)



            # Create a random number filename for images
            random_number_filename = random.randint(1, 1000)
            random_number_filename = str(random_number_filename)
            print("Random number type: ", type(random_number_filename))

            # Save image to static folder
            test_save_image = custom_vision_render_image_url(random_number_filename, custom_vision_url)
            saved_image_file = "/static/" + random_number_filename + ".png"

            # TODO: Add the folder you will download to image to images_folder
            images_folder = ''

            # Create a placeholder for messages
            messages = []

            with open(images_folder + random_number_filename + ".png", "rb") as image_contents:
                results = predictor.classify_image(
                    project_id, publish_iteration_name, image_contents.read())

                """ TODO: 1. Loop through results.predictions and
                          2. Append prediction.tag_name and prediction.probability to messages
                          3. Return messages.
                """

            return messages

        else:
            messages = ['Please enter an image URL']
            return messages


    # TODO: Call process_custom_vision() and save to messages
    messages = ''

    return render_template("custom_vision_url.html", image_uri=custom_vision_url, messages=messages)

















