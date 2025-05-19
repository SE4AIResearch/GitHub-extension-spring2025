## Commit Pro
Commit Pro is a browser extension designed for Git to help developers understand code changes at a commit level by providing code summaries based on code or refactoring changes. Clear and understandable commit messages are crucial for code documentation, but there is a current lack in documentation standards for developers leading to vague and inconsistent commit messages. Commit Pro addresses this challenge by generating detailed summaries on code changes especially from refactoring instances along with the intent and impact of the change in the codebase to help developers have more productive code reviews.
## Name of team members:
-Vaibhavi Shah <br/>
-Meghna Agrawal <br/>
-Ali Vaziri <br/>
-Ishan Garg <br/>
-Priyanshi Yadav <br/>
## Steps for running the chrome extension
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
</ul>

## Understand Tool -
- Install the Understand Tool- https://licensing.scitools.com/download
- Please follow the steps mentioned over here for obtaining the license code- https://scitools.com/student
- Open the Understand tool and navigate to the Licensing through the Help option present in the navigation bar
  ![image](https://github.com/user-attachments/assets/f5f6e549-6764-44d0-813f-752755f920bf)
- Provide the obtained license code from step 2 and click on OK
</ul>

## Manually running the application:
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
- Extract the resources_mac.zip/resources_win.zip folder and rename it as resources (if using mac machine then resources_mac.zip and in case of windows machine extract resources_win.zip)
Run the following command from chromeext_backend folder:
-	mvn clean install
-	Go to the src -> main -> java -> saim
-	Right click on RestServiceApplication.java and click on "Run java"

## Dockerized version:
- Please add your OpenAI API key in docker-compose.yml in the place of highlighted variable
  ![image](https://github.com/user-attachments/assets/bd1602a6-3648-42bd-8e2e-b73821bc919c)

Run the following command from the main folder:
- restart.bat
- start.bat

## After Setup of application:
### After following the above-mentioned steps-
- Open chrome browser and go to "chrome://extensions/"
- Click on "Load unpacked"
- Upload the "chromeext_frontend" folder
- Open any java repository e.g., "https://github.com/danilofes/refactoring-toy-example/commit/d4bce13a443cf12da40a77c16c1e591f4f985b47" or "https://github.com/jaygajera17/E-commerce-project-springBoot/commit/a229716179982a98f41033f7d76670f344b68cd8"
- Click on extension icon
- Click on Commit Pro
- Click on setting icon
- Provide the GitHub Oauth token
- Provide the OpenAPI key
- Click on back button
- Click on "Generate Summary" button

## TroubleShooting:
If the Dashboard is not showing any metrics then recheck for the license code provided in Understand tool.
