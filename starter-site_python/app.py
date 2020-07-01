import os, base64, json, requests
from flask import Flask, render_template, request

# Load system variables with dotenv
from dotenv import load_dotenv
load_dotenv('../.env')

import image_helper
import json as j
import uuid
import time
# import cv2
import operator
import numpy as np
import datetime

import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
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
_sentiment_key = os.environ["_sentiment_key"]


_base_url = os.environ["base_url"]

_sentiment_url = os.environ["sentiment_url"]


COGSVCS_CLIENTURL = _base_url
COGSVCS_KEY = _key
COGSVCS_REGION = 'eastus'

# Create vision_client
from msrest.authentication import CognitiveServicesCredentials
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import ComputerVisionErrorException

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



# Working image code!
def render_image(result_title, image_url):

  """Display the obtained results onto the input image"""

  image = Image.open(BytesIO(requests.get(image_url).content))

  fig, ax = plt.subplots(figsize=(4, 4), dpi=300)

  ax.imshow( image )

  plt.title(result_title, fontsize=30, va="center", color='r', weight='heavy')

  plt.axis('off')



  plt.savefig('static/' + result_title)




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


    # Set the default for language translation
    target_language = 'en'

    # If it"s a GET, just return the form


    # Create a placeholder for translation results
    messages = []


    # Add code to retrieve/process text from picture
    messages = extract_text_from_image(image.blob, vision_client)


    # Add code to translate text
    messages = translate_text(messages, target_language, COGSVCS_KEY, COGSVCS_REGION)

    return render_template("translate_upload.html", image_uri=image.uri, target_language=target_language, messages=messages)


# Extract text from image
def extract_text_from_image(image, client):
    try:
        # make the API call and then return the results
        pass
    except ComputerVisionErrorException as e:
        print(e)
        return ["Computer Vision API error: " + e.message]

    except Exception as e:
        print(e)
        return ["Error calling the Computer Vision API"]


# Translate text
def translate_text(lines, target_language, key, region):
    uri = "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=" + target_language


    headers = {
        'Ocp-Apim-Subscription-Key': translate_key,
        'Ocp-Apim-Subscription-Region': 'eastus',
        'Content-type': 'application/json'
    }

    input=[]

    # for each line of text in the image
    for line in lines:
        input.append({ "text": line })

    try:
        # calling the translation API
        pass

        # return the results
    except requests.exceptions.HTTPError as e:
        return ["Error calling the Translator Text API: " + e.strerror]

    except Exception as e:
        return ["Error calling the Translator Text API"]


#---------------------------------------------------------------------------------------------------------------------#
# MY CODE

@app.route("/translate_url", methods=["GET", "POST"])
def translate_image_url():

    image = get_image(request)

   # Set the default for language translation
    target_language = "en"
    web_url = ''


    ### IMPORTANT ###
    # Add if URL text box is empty do not call the API



        # If it"s a GET, just return the form
    if request.method == "GET":
        return render_template("translate_url.html", image_uri=image.uri, target_language=target_language, web_url=web_url)

    if(web_url is not ''):
            json = { 'url': web_url }
            data = None

            # Add code to retrieve text from picture



            #params set translation params
            params = '&to='+target_language

            # Convert result to json
            convert_to_json = j.dumps(result_list)

            # Translate extracted result
            body = [{'text': convert_to_json}]


            result_list = translate_text2(translator_dict['translator_text_API'][0]['_key'], params, data, body)

            # Create a placeholder for messages
            messages = []
            for i in result_list[0]['translations']:
                messages.append(i['text'])

            print("TRANSLATED TEXT: ", messages)

            return render_template("translate_url.html", image_uri=web_url, target_language=target_language, messages=messages)


    else:
        messages = 'This is empty!'
        return render_template("translate_url.html", image_uri=web_url, target_language=target_language, messages=messages)



def text_recognition(_url, headers, json, data):

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
def translate_text2(translate_urltranslate_key, params, data, json):

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


def render_text_recognition_image(result, image):

  polygons = []

  if ("analyzeResult" in result):

    # Extract the recognized text, with bounding boxes.
    polygons = [(line["boundingBox"], line["text"])
    for line in result["analyzeResult"]["readResults"][0]["lines"]]

  #image = Image.open(BytesIO(requests.get(image_url).content))

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


#---------------------------------------------------------------------------------------------------------------------#
# Computer Vision API (landmark detection)

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

# GET and POST to landmark (Computer Vision API)
@app.route("/landmark_url", methods=["GET", "POST"])
def landmark_image_url():

    '''WIP CODE'''

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
            #print("NOT EMPTY", landmark_url)
            json = { 'url': landmark_url }
            data = None

            # TODO: Add code to retrieve text from picture
            #messages = extract_text_from_image(image.blob, vision_client)
            analyze_result = processRequest(analyze_dict['computer_vision_API'][0]['url'],
                        json,
                        data,
                        analyze_dict['computer_vision_API'][0]['headers'],
                        analyze_dict['computer_vision_API'][0]['params'] )


    else:
        messages = ['Please enter an image URL']
        return render_template("landmark_url.html", image_uri=landmark_url, messages=messages)





