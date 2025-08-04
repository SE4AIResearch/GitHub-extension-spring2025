## CommitPro
CommitPro is a browser extension designed for Git to help developers understand code changes at a commit level by providing code summaries based on code or refactoring changes. Clear and understandable commit messages are crucial for code documentation, but there is a current lack in documentation standards for developers leading to vague and inconsistent commit messages. CommitPro addresses this challenge by generating detailed summaries on code changes especially from refactoring instances along with the intent and impact of the change in the codebase to help developers have more productive code reviews.
## Name of team members:
-Vaibhavi Shah <br/>
-Meghna Agrawal <br/>
-Ali Vaziri <br/>
-Ishan Garg <br/>
-Priyanshi Yadav <br/>
-Kevin Lui <br/>
-Josephine Choong <br/>
-Ryan Jo <br/>
## Steps for running the Chrome extension
## Pre-requisites:
<ul>
  <li>Maven: https://www.youtube.com/watch?v=YTvlb6eny_0</li>
  <li>Java: SDK https://www.youtube.com/watch?v=5LlfwQ4xzXc</li>
  <li>Node.js: https://www.youtube.com/watch?v=4FAtFwKVhn0
  <ul>
  <li>Path setup: https://www.youtube.com/watch?v=Pa-YPdl1rX8</li>
  </ul></li>
</ul>
Check Edit the System Environment Variables on your workspace -> Click Environment Variables -> Under system variables click on Path and check all 3 paths to the downloads are there.

## GitHub and OpenAI Keys -
<ul>
  <li>https://github.com/settings/tokens -> generate new token(classic) -> name it and click generate (Make sure to note this down somewhere)
    Note: This token expires after a while (usually 30 days) -> Make sure to generate a new one if it does</li>
  <li>https://platform.openai.com/api-keys -> Sign in -> Create New Secret Key(Make sure to note this key down somewhere as well) Important: This tool only works if you have money in your OpenAI account, $5 is enough</li>
  <ul>
  <li> https://platform.openai.com/settings/organization/billing/overview -> To add money into your OpenAI account. 
  </ul></li>
</ul>

## Understand Tool -
- Install the Understand Tool: https://licensing.scitools.com/download
- Please follow the steps mentioned over here for obtaining the license code: https://scitools.com/student
- Open the Understand tool and navigate to the Licensing through the Help option present in the navigation bar
  ![image](https://github.com/user-attachments/assets/f5f6e549-6764-44d0-813f-752755f920bf)
- Provide the obtained license code from step 2 and click on OK
</ul>

## Dockerized Local Installation Version (recommended) -
- Ensure Docker Desktop is open
- Run `start.bat` in a Command Prompt terminal
- Follow the instructions in the console, inputting your OpenAI API key
- In a new Command Prompt terminal, run `npm i`, then run `npm build`
- Navigate to `chromeext_frontend/build/` folder, cut and paste all the contents into the `chromeext_frontend/` folder 

## Manually Installing The Application (not recommended, deprecated) - 
### For frontend -
Run the following commands from chromeext_frontend folder:
-	npm i react
-	npm i react-chartjs-2
-	npm run build
-	Once build command run successfully -> build folder will be generated within chromeext_frontend folder
-	From build folder -> copy the static folder and index.html
-	Paste them directly under the chromeext_frontend folder

### For rag -
Run the following command from chromeext_metrics folder:
-	pip install -r requirements.txt
-	hypercorn rag:app

### For backend -
- Open chromeext_backend\src\main\
- Extract the resources_mac.zip/resources_win.zip folder and rename it as resources (if using mac machine then resources_mac.zip and in case of windows machine extract resources_win.zip) Run the following command from chromeext_backend folder:
-	mvn clean install
-	Go to the src -> main -> java -> saim
-	Right click on RestServiceApplication.java and click on "Run java"



## After Setup of application:
### After following the above-mentioned steps-
- Open a Chrome browser and go to "chrome://extensions/"
- Enable Developer Mode
- Click on "Load unpacked"
- Upload the "chromeext_frontend" folder
- Open any Java repository, e.g. "https://github.com/danilofes/refactoring-toy-example/commit/d4bce13a443cf12da40a77c16c1e591f4f985b47" or "https://github.com/jaygajera17/E-commerce-project-springBoot/commit/a229716179982a98f41033f7d76670f344b68cd8"
- Click on the extension icon
- Click on CommitPro
- Click on the settings icon
- Provide the GitHub OAuth token
- Provide the OpenAPI key
- Click on the back button
- Click on the "Generate Summary" button

## Metrics
To view metrics, after generating the commit's summary, click on the "Repository Analysis" link near the bottom of the generated commit message.

Metrics Listed: 
- <b> Cyclomatic Complexity (CC) </b> -> Indicates how complex the decision structure is
- <b> Lines of Code (LOC) </b> -> Counts the total number of lines
- <b> Coupling Between Objects (CBO) </b> -> The number of distinct classes to which a given class is connected
- <b> Lack of Cohesion of Methods (LCOM) </b> -> Quantifies how many method pairs in a class do not share instance variables—with higher values meaning lower cohesion among methods
- <b> Weighted Methods per Class (WMC) </b> -> Sum of the cyclomatic complexities of all methods in a class, representing its overall internal complexity
- <b> Depth of Inheritance Tree (DIT) </b> -> The maximum number of ancestor classes from a given class up to the root of the inheritance hierarchy
- <b> Number of Children </b> -> The count of immediate subclasses that directly inherit from a particular class

## Troubleshooting:
- If the Dashboard is not showing any metrics, then check for the license code provided in the Understand tool.
- Ensure Docker Desktop is installed (https://www.docker.com/) and delete all associated CommitPro containers before reattempting.
- If Spring Boot App fails to start, try deleting CommitPro Docker containers, running `restart.bat` and `start.bat`
- If errors occur during the generation of the summary:
  - Ensure there is some money in your OpenAI API account
  - Try removing the extension and reloading it
  - Ensure your OpenAI API key is in the `chromeext_metrics/.env/` file (should look like `OPENAI_API_KEY=sk-proj-...`)
<p align="center">
  <img src="https://github.com/user-attachments/assets/13d96a36-5ab8-4e4a-92aa-9f6b71aa5450" alt="image" width="300"/>
  <br>
  <em>Blank Commit Summary After Error</em>
</p>


