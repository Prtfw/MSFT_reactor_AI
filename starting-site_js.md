# Starter site

We'll be adding functionality to an existing website, which represents our client, Contoso Travel. Contoso Travel is working to enable travelers to translate street signs and identify who is in a picture. You'll add functionality to three separate sections of the website - **translate** for sign translation, **train** for training the application to cruise ships, and finally **detect** to identify cruise ships.

## Obtaining the starter site

The sample code is provided as part of the [Reactors](https://github.com/microsoft/reactors) repository on [GitHub](https://github.com). Let's clone the repository and get the environment setup for the code.

### Clone the repository

1. Open a new command or terminal window to use solely for running your application
2. Navigate to the folder you want to put the code into, which was created earlier
3. Clone the repository

``` git
git clone https://github.com/microsoft/reactors
```

### Install Python packages

1. Navigate to the AI directory

``` console
# Windows
cd reactors\AI_1\starter-site_js

# Linux or macOS
cd ./reactors/AI_1/starter-site_js
```

2. Now, we'll install the packages listed in requirements.txt by using npm (or yarn)

``` console
npm install

# macOS or Linux
npm install
```

## Explore the current files

Take a moment to browse the files that were copied into the project directory. Open **starter-site** in the code editor of your choice. If you are using [Visual Studio Code](https://code.visualstudio.com), you can perform this operation by using the command `code .` from the terminal or command window.

Verify the following files exist:

- **index.js**, which holds the node and express code that drives the site
- **image.py**, which holds a helper class we'll use for image management
- **templates/??.html**, the template for the different page
- **views/??.ejs**, the ejs templating for different pages
- **views/partials/??.ejs**, the folder for some reusable / small ejs components, to be used by the main ejs pages
- **static/main.css**, which contains CSS to dress up the home page
- **static/banner.jpg**, which contains the website banner
- **static/placeholder.jpg**, which contains a placeholder image for photos that have yet to be uploaded

> **NOTE:** We won't be focusing on working with HTML or EJS during this course. We want to be able to focus on the code necessary for Cognitive Services.

## Start the site

Let's start the site using Flask. We will configure Flask to run in development mode by setting the `FLASK_ENV` environmental variable. Running Flask in development mode is helpful when you’re developing a website because Flask automatically reloads any files that change while the site is running. If you let Flask default to production mode and change the contents of an HTML file or other asset, you have to restart Flask to see the change in your browser.

``` bash
# Windows
npm start
or
yarn dev

# macOS or Linux
npm start
or
yarn dev
```

> **NOTE:** **Keep this terminal or command window open**, as we're going to be making changes to our site throughout the day. If you accidentally close it, you can restart your site by issuing the same commands from above.

## Open the site

Open a browser and navigate to `http://localhost:5000`. Confirm the website appears. If you click the buttons the three pages we'll be working with will each open. You will notice the functionality is limited to just displaying the image you upload. We're going to start adding code to add the ability to translate street signs, and eventually detect people in images.

## Next steps

Congratulations! You've configured your environment and are ready to complete the rest of the labs! The code structure and the hints we left for you to complete the labs. If you get stuck please feel free to review the reference implementation in ```solution-site_js``` folder or ask the MSFT team for help.
