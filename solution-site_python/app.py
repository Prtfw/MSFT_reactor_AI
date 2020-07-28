import os, base64, json, requests
from flask import Flask, render_template, request

# Load system variables with dotenv
from dotenv import load_dotenv
load_dotenv()

import image_helper
import json as j
import uuid
import time
import os
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
project_id = os.environ["sampleProject"]


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

# Cognitive API for Computer Vision image URL
analyze_dict = {'computer_vision_API':
                    [{'url': _base_url + '/vision/v3.0/analyze',
                      '_key': _key,
                      'headers': headers,
                      'params': {'visualFeatures': 'Categories,Description,Color'}}]}

# Custom Vision API - Object Detection image URL
detect_dict = {'object_detection_API':
                   [{'url': _base_url + 'vision/v3.0/detect',
                     '_key': _key,
                     'headers': headers,
                     'params': {'visualFeatures': 'Objects,Description'}}]}

# OCR API image URL
text_recognition_dict = {'text_recognition_API':
                             [{'url': _base_url + '/vision/v3.0/read/analyze',
                               '_key': _key,
                               'headers': headers}]}

# Cognitive API for Translator Text image URL
translator_dict = {'translator_text_API':
                       [{'url': 'https://api.cognitive.microsofttranslator.com/' + '/translate?api-version=3.0',
                         '_key': translate_key,
                         'headers': {
                             'Content-Type': 'application/json',
                             'Ocp-Apim-Subscription-Key': translate_key,
                             'Ocp-Apim-Subscription-Region': 'australiaeast',
                             'X-ClientTraceId': str(uuid.uuid4())
                         }}]}

# Cognitive API for Text Analytics image URL
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


def processRequest(_url, json, data, headers, params ):

    """
    Helper function to process the request to Project Oxford

    Parameters:
    json: Used when processing images from its URL. See API Documentation
    data: Used when processing image read from disk. See API Documentation
    headers: Used to pass the key information and the data type request
    """

    retries = 0
    result = None

    while True:
        response = requests.request( 'post', _url, json = json, data = data, headers = headers, params = params )

        if response.status_code == 429:

            print( "Message: %s" % ( response.json() ) )

            if retries <= _maxNumRetries:
                time.sleep(1)
                retries += 1
                continue
            else:
                print( 'Error: failed after retrying!' )
                break

        elif response.status_code == 200 or response.status_code == 201:
            # print(response.json())
            if 'content-length' in response.headers and int(response.headers['content-length']) == 0:
                result = None
            elif 'content-type' in response.headers and isinstance(response.headers['content-type'], str):
                if 'application/json' in response.headers['content-type'].lower():
                    result = response.json() if response.content else None
                elif 'image' in response.headers['content-type'].lower():
                    result = response.content
        else:
            print( "Error code: %d" % ( response.status_code ) )
            print( "Message: %s" % ( response.json() ) )

        break

    return result

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


def custom_vision_render_image(image_filename, image_blob):

    image = Image.open(image_blob)

    fig, ax = plt.subplots(figsize=(4, 4), dpi=300)

    ax.imshow( image )

    plt.axis('off')

    plt.savefig('static/' + image_filename)

    image.close()


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

# Changed translate to translate upload
@app.route("/translate_upload", methods=["GET", "POST"])


def translate():

    # Load image or placeholder
    image = get_image(request)

    print("Get image request: ", image)

    # Set the default for language translation
    target_language = "en"
    if request.form and "target_language" in request.form:
        target_language = request.form["target_language"]


    # If it"s a GET, just return the form
    if request.method == "GET":
        return render_template("translate_upload.html", image_uri=image.uri,  target_language=target_language)

    print("LANGUAGE:", target_language)

    # Create a placeholder for messages
    messages = []

    try:

        messages = extract_text_from_image_upload(image.blob, vision_client)
        print("MESSAGES 1: ", messages)

        messages = translate_text_upload(messages, target_language, COGSVCS_KEY, COGSVCS_REGION)
        print("MESSAGES 2 translate text: ", messages)

        return render_template("translate_upload.html", image_uri=image.uri, target_language=target_language, messages=messages)

    except ComputerVisionErrorException as e:
        print(e)
        return ["Computer Vision API error: " + e.message]


    except Exception as error:
        print("Exception error: ", error)
        messages = ['Sorry something went wrong. ', error]
        return render_template("translate_upload.html", image_uri=image.uri, target_language=target_language, messages=messages)


# Extract text from image
def extract_text_from_image_upload(image, client):

    print("Extract text from image function. ")
    try:
        result = client.recognize_printed_text_in_stream(image=image)

        lines=[]
        if not result.regions:
            lines.append("Photo contains no text to translate")
        else:
            for line in result.regions[0].lines:
                text = " ".join([word.text for word in line.words])
                lines.append(text)
                print("TEST LINES: ", lines)
        return lines
    except ComputerVisionErrorException as e:
        print(e)
        return ["Computer Vision API error: " + e.message]


    except Exception as e:
        print(e)
        return ["Error calling the Computer Vision API"]


# Translate text
def translate_text_upload(lines, target_language, key, region):

    print("In function translate text! ")
    uri = "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=" + target_language


    translate_headers = {
        'Ocp-Apim-Subscription-Key': translate_key,
        'Ocp-Apim-Subscription-Region': 'australiaeast',
        'Content-type': 'application/json'
    }

    input=[]

    for line in lines:
        input.append({ "text": line })

    try:
        response = requests.post(uri, headers=translate_headers, json=input)
        response.raise_for_status() # Raise exception if call failed
        results = response.json()

        translated_lines = []

        for result in results:
            for translated_line in result["translations"]:
                translated_lines.append(translated_line["text"])
        print("TRANSLATED LINES: ", translated_lines)

        return translated_lines

    except requests.exceptions.HTTPError as e:
        return ["Error calling the Translator Text API: " + e.strerror]

    except Exception as e:
        return ["Error calling the Translator Text API"]


#---------------------------------------------------------------------------------------------------------------------#

@app.route("/translate_url", methods=["GET", "POST"])

def translate_image_url():

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

    if(web_url is not ''):
            print("NOT EMPTY", web_url)
            json = { 'url': web_url }
            data = None


            result = extract_text_from_image(text_recognition_dict['text_recognition_API'][0]['url'],
                                            text_recognition_dict['text_recognition_API'][0]['headers'],
                                            json,
                                            data)

            result_list = []
            for i in result['analyzeResult']['readResults'][0]['lines']:
                result_list.append(i['text'])

            print("EXTRACT TEXT FROM IMAGE: ", result)
            print("MESSAGES: ", result_list)

            #params = '&to=es'
            params = '&to='+target_language

            # Convert result to json
            convert_to_json = j.dumps(result_list)

            # Translate extracted result
            body = [{'text': convert_to_json}]


            result_list = translate_text_url(translator_dict['translator_text_API'][0]['_key'], params, data, body)


            # Create a placeholder for messages
            messages = []
            for i in result_list[0]['translations']:
                messages.append(i['text'])


            print("Messages: ", messages[0])

            print("TRANSLATED TEXT: ", messages)

            return render_template("translate_url.html", image_uri=web_url, target_language=target_language, messages=messages)


    else:
        messages = 'This is empty!'
        return render_template("translate_url.html", image_uri=web_url, target_language=target_language, messages=messages)



def extract_text_from_image(_url, headers, json, data):

    response = requests.request( 'post', _url, headers = headers, json = json, data = data)
    response.raise_for_status()
    operation_url = response.headers["Operation-Location"]

    result = {}
    while (True):
        response_final = requests.get(
            response.headers["Operation-Location"], headers=headers)

        result = response_final.json()

        time.sleep(1)

        if ("analyzeResult" in result):
                break
        if ("status" in result and result['status'] == 'failed'):
                break
    return result


    # Helper function to translate text
def translate_text_url(translate_key, params, data, json):

  constructed_url = translator_dict['translator_text_API'][0]['url'] + params

  response = requests.request('post', constructed_url, data = data, json=json, headers = translator_dict['translator_text_API'][0]['headers'])
  response.raise_for_status()
  result = response.json()

  return result



# Convert translation to json
def translation_to_json(result):
  text_to_translate = []

  for i in result['analyzeResult']['readResults'][0]['lines']:
    text_to_translate.append(i['text'])

  convert_to_json = j.dumps(text_to_translate)

  return convert_to_json


#---------------------------------------------------------------------------------------------------------------------#
# Computer Vision API (landmark detection)

#-------------------------------------------------------------------------------------------------------------------------------------------#

# GET and POST to landmark image URL (Computer Vision API)
@app.route("/landmark_url", methods=["GET", "POST"])

def landmark_image_url():

    image = get_image(request)

   # Image URL to detect landmark
    landmark_url = ''

     # Create a placeholder for messages
    messages = []


    ### IMPORTANT ###
    # Add if URL text box is empty do not call the API
    if request.form and ("landmark_url" in request.form):
        landmark_url = request.form["landmark_url"]
        print(49,'now call api with this img url', landmark_url)

        # If it"s a GET, just return the form
    if request.method == "GET":
        return render_template("landmark_url.html", image_uri=image.uri, landmark_url=landmark_url)

    if(landmark_url is not ''):

            json = { 'url': landmark_url }
            data = None

            # Process the request
            analyze_result = processRequest(analyze_dict['computer_vision_API'][0]['url'],
                        json,
                        data,
                        analyze_dict['computer_vision_API'][0]['headers'],
                        analyze_dict['computer_vision_API'][0]['params'] )

            print("Analyze result: ", analyze_result)



#-------------------------------------------------------------------------------------------------------------------------------------------#
# Landmark request

            # If landmark detected
            try:

                if ( analyze_result['categories'][0]["detail"]['landmarks'][0]['name'] ):

                    print("Analyse result text below: ", analyze_result['categories'][0]["detail"]['landmarks'][0]['name'])

                    # Landmark name
                    messages = [analyze_result['categories'][0]["detail"]['landmarks'][0]['name']]

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


   # Post image to API and get result
    analyze_result = processRequest(analyze_dict['computer_vision_API'][0]['url'],
                json,
                data,
                landmark_upload_headers,
                analyze_dict['computer_vision_API'][0]['params'] )



    # If landmark detected
    try:


        if ( analyze_result['categories'][0]["detail"]['landmarks'][0]['name'] ):

            print("Analyse result text landmark: ", analyze_result['categories'][0]["detail"]['landmarks'][0]['name'])
            messages = [analyze_result['categories'][0]["detail"]['landmarks'][0]['name']]

            print("Landmark messages: ", messages)
            # Render image with result text

            render_url_test = render_upload_image(analyze_result['categories'][0]["detail"]['landmarks'][0]['name'], landmark_upload_image.blob)

            saved_landmark_image = "/static/" + analyze_result['categories'][0]["detail"]['landmarks'][0]['name'] + ".png"
            print("Under saved landmark image")
            return render_template("landmark_upload.html", image_uri= saved_landmark_image, messages=messages)

    except:
        print("IN first except")

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
                    print( analyze_result['categories'] )
                    return render_template("landmark_upload.html", image_uri= landmark_upload_image.uri, messages=messages)


            except:

                try:

                    if(analyze_result['categories'] == []):

                        print("No landmark detected.", analyze_result['description']['captions'][0]['text'])
                        messages = ["No landmark detected. Detected objects: ", analyze_result['description']['captions'][0]['text'] ]
                        return render_template("landmark_upload.html", image_uri= landmark_upload_image.uri, messages=messages)
                except:

                    print("Error")
                    messages = ['ERROR']
                    return render_template("landmark_upload.html", image_uri=landmark_upload_image.uri, messages=messages)

#-------------------------------------------------------------------------------------------------------------------------------------------#
# Object Detection API

# GET and POST to landmark image URL (Computer Vision API)
@app.route("/object_detect_url", methods=["GET", "POST"])

def object_detect_url():

    '''WIP CODE'''

    image = get_image(request)

   # Image URL to detect objects
    web_url = ''

     # Create a placeholder for messages
    messages = []


    ### IMPORTANT ###
    # Add if URL text box is empty do not call the API
    if request.form and ("web_url" in request.form):
        web_url = request.form["web_url"]
        print(49,'now call api with this img url', web_url)

        # If it"s a GET, just return the form
    if request.method == "GET":
        return render_template("object_detect_url.html", image_uri=image.uri, web_url=web_url)

    # If image url is not empty
    if(web_url is not ''):
            #print("NOT EMPTY", web_url)
            detect_json = { 'url': web_url }
            data = None


            # Object detection result
            detection_result = processRequest(detect_dict['object_detection_API'][0]['url'],
                        detect_json,
                        data,
                        detect_dict['object_detection_API'][0]['headers'],
                        detect_dict['object_detection_API'][0]['params'] )

            print("Detection result: ", detection_result)


            detection_text_list = []
            for i in detection_result['objects']:
                detection_text_list.append(i['object'])
                listToStr = ' '.join([str(elem) for elem in detection_text_list])

            print("Detection list: ", detection_text_list)

            if(detection_text_list == []):
                print("Empty")
                messages = ["No objects detected. "]
                return render_template("object_detect_url.html", image_uri= web_url, messages=messages)

            else:
                print("Not empty.")



# Object detection request url

                try:
                    messages = ["Objects detected: ", detection_text_list ]
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
        detection_result = processRequest(detect_dict['object_detection_API'][0]['url'],
                            detect_json,
                            data,
                            object_detect_upload_headers,
                            detect_dict['object_detection_API'][0]['params'] )

        print("Detection result: ", detection_result)


        detection_text_list = []
        for i in detection_result['objects']:
            detection_text_list.append(i['object'])
        listToStr = ' '.join([str(elem) for elem in detection_text_list])


        if(detection_text_list == [] or detection_result == None):
            print("Empty")
            messages = ["No objects detected. "]
            return render_template("object_detect_upload.html", image_uri= detect_upload_image.uri, messages=messages)

        else:
            print("Detection list: ", detection_text_list[0])
            print("Not empty.")


    # Object detection request upload

            try:
                messages = ["Objects detected: ", detection_text_list ]

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

        # # Cognitive API for Text Analytics
    def sentiment_analysis(text, language):

        documents = {"documents": [
            {"id": "1", "language": language,
                "text": text}
                    ]}

        response = requests.post(sentiment_dict['sentiment_analytics_API'][0]['url'],
                                headers=sentiment_dict['sentiment_analytics_API'][0]['headers'],
                                json=documents)

        sentiment_result = response.json()

        return sentiment_result


    # Translation
    def process_translation(sentiment_text):

        if(sentiment_text is not ''):
            messages = []

            # Convert text to json
            convert_to_json = j.dumps(sentiment_text)

            print("Sentiment text type", type(sentiment_text))

            body = [{'text': convert_to_json}]
            data = None

            print("BODY type", type(body))

            params = '&to='+ 'en'

            print("Params", params)

            translation_result = translate_text_url(translator_dict['translator_text_API'][0]['_key'], params, data, body)

            print("Translated result", translation_result)

            translation = ''
            for i in translation_result[0]['translations']:
                translation = i['text']
                translation = str(translation).strip('[]')
            print("Translation", translation)

            messages = translation
            print("Messages", messages)

            return messages

        else:
            messages = ["Invalid"]

            return messages



    def process_sentiment(translation, sentiment_result):

        if(translation == ["Invalid"]):
            messages = ["You need to enter a sentence. "]

            return messages

        elif(translation is not ''):

            if(sentiment_result is not ''):
                print("Score: ", sentiment_result['documents'][0]['score'])

                # Formatting the score to %
                sentiment_score = round( round(sentiment_result['documents'][0]['score'], 2) * 100 )


                for i in sentiment_result['documents']:
                    score = i['score']
                    if(score >= 0.50):
                        messages = [f"This is probably a positive sentence with a {sentiment_score} % sentiment score"]
                    else:
                        messages = [f"This is probably a negative sentence with a {sentiment_score} % sentiment score."]


                return messages

            else:
                messages = ["No result. "]

                return messages

        else:
            messages = ["You need to enter a sentence. "]

            return messages

    # Translate text to English
    translation = process_translation(sentiment_text)

    # Sentiment result
    sentiment_result = sentiment_analysis(translation, 'en')

    # Return sentiment result
    messages = process_sentiment(translation, sentiment_result)

    # Render result of translation to translate_url_test
    return render_template("sentiment.html",  messages=messages)


#-------------------------------------------------------------------------------------------------------------------------------------------#
# Custom Vision Image Url


@app.route("/custom_vision_url", methods=["GET", "POST"])

def custom_vision_url():

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

            # Create a placeholder for messages
            messages = []

            # Create a random number filename for images
            random_number_filename = random.randint(1, 1000)
            random_number_filename = str(random_number_filename)
            print("Random number type: ", type(random_number_filename))

            # Save image to static folder
            test_save_image = custom_vision_render_image_url(random_number_filename, custom_vision_url)
            saved_image_file = "/static/" + random_number_filename + ".png"

            # Add your path to the static folder
            images_folder = ''

            with open(images_folder + random_number_filename + ".png", "rb") as image_contents:
                results = predictor.classify_image(
                    project_id, publish_iteration_name, image_contents.read())

                # Display the results.
                for prediction in results.predictions:
                    print("\t" + prediction.tag_name +
                        ": {0:.2f}%".format(prediction.probability * 100))
                    messages.append(("\t" + prediction.tag_name +
                        ": {0:.2f}%".format(prediction.probability * 100)))

            print("MESSAGES", messages)

            return messages

        else:
            messages = ['Please enter an image URL']
            return messages


    messages = process_custom_vision(custom_vision_url)

    return render_template("custom_vision_url.html", image_uri=custom_vision_url, messages=messages)





















