## Commit Pro
Commit Pro is a Google Chrome Extension designed for GitHub to help developers understand code changes at a commit level by providing code summaries based on code or refactoring changes. Clear and understandable commit messages are crucial for code documentation, but there is a current lack in documentation standards for developers leading to vague and inconsistent commit messages. Commit Pro addresses this challenge by generating detailed summaries on code changes especially from refactoring instances along with the intent and impact of the change in the codebase to help developers have more productive code reviews.

#### Commit Pro Demo + Video Installation
Commit Pro User Demo: https://stevens.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=d5fc2b35-8293-4dea-83b5-b1b60168bd2a&start=0

Commit Pro Installation + Setup: https://stevens.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=228e5f3f-26b5-4fbe-9690-b1b4015a3333&start=0

Commit Pro Demo: https://stevens.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=0b6934a1-9dc8-4f9f-8ee5-b1b401628b01&start=0

### Installation
Things required for Commit Pro:
- Maven: https://www.youtube.com/watch?v=YTvlb6eny_0
- Java: SDK https://www.youtube.com/watch?v=5LlfwQ4xzXc
- MySQL: https://www.youtube.com/watch?v=fzd6-qcLzrE
- Node.js: https://www.youtube.com/watch?v=4FAtFwKVhn0
  - Path setup: https://www.youtube.com/watch?v=Pa-YPdl1rX8
 
Check Edit the System Environment Variables on your workspace -> Click Environment Variables -> Under system variables click on Path and check all 4 paths to the downloads are there
 
#### 1. Database Setup
1. In your command prompt type in the command **mysql -u root -p** -> Default user is root choose the username you used when setting up mysql as well as the password when you hit Enter
2. To create database type in **create database name_of_your_database;** -> Make sure to remember this database name, To make sure the database is there type in **show databases;**

#### 2. Downloading Repo
1.  Download the source code of the repo by clicking on the green button **Code** -> Download zip
2.  In your file system click on Extract All and extract it into your Downloads folder

#### 3. Vscode Setup
1. Open the folder now in Vscode, in the extensions icon on Vscode itself, download **Extension Pack for Java**
2. Need to configure our database file now go to the resources folder under chromeext_backend/src/main
3. In the resources folder go to application.properties file. Make sure the port number (so in my end it is 3306, picture for reference) is the same when you setup MySQL. Also make sure your **database_name** is the same (on my end it is commit_database2). Change that line to the database name you gave it. Do the same with username and password(in the picture my username and password is root and root123! respectively)
   ![image](https://github.com/user-attachments/assets/6230e7f0-0402-4ab8-9505-4b803e446ed3)

#### 4. GitHub and OpenAI Keys
1. https://github.com/settings/tokens -> generate new token(classic) -> name it and click generate (Make sure to note this down somewhere)
   - **Note: This token expires after a while (usually 30 days) -> Make sure to generate a new one if it does**
3. https://platform.openai.com/api-keys -> Sign in -> Create New Secret Key(Make sure to note this key down somewhere as well) **Important: This tool only works if you have money in your OpenAI account, $5 is enough**

#### 5. Setting up Keys in Vscode and Vscode Setup
**Important: Use powershell in your VsCode terminal**
1. In the root directory there is github-oauth.properties file -> Copy your generated GitHub Key and replace the key already there. (OAuthToken="YOUR KEY")
2. Go into your backend folder for the project in your Vscode terminal, **cd chromeext_backend**, copy your OpenAI key that you have generated. In the Vscode terminal type in the command **${env:OPENAI_API_KEY}="YOUR OPENAI KEY GOES INSIDE HERE"** (Copy your key inside the double quotations and hit enter). To make sure the key is there type in the command **${env:OPENAI_API_KEY}** and hit Enter and make sure your key is returned
3. You are in your backend folder in the terminal, type in the command **mvn clean install** and wait until everything is downloaded

#### 6. Unpacking the frontend portion
1. Go to the site chrome://extensions, in the top right make sure Developer Mode is Switched on
   ![image](https://github.com/user-attachments/assets/4faacbd8-9a7a-4436-a6d4-e88588890f64)
2. Click on **Load Unpacked** select your main folder and then select the **chromeext_frontend folder** and then click **Select Folder**

#### 7. Running the Chrome Extension
1. In Vscode, go to the chromeext_backend/src/main/java/saim folder and then click on the RestServiceApplication.java file. Right Click and **Run Java**. If this is successful your terminal should look like this
![image](https://github.com/user-attachments/assets/ba525dba-5192-41e0-8b18-1a319f852e9a)
2. Go back to chrome://extensions. You will see that the service worker is inactive. Click the reload button in that
   ![image](https://github.com/user-attachments/assets/1b3c7020-f370-47db-9deb-d34bcd769728)
3. Now the extension is working, you can use this tool on paths that follow this pattern: https://github.com/user/project/commit/id and https://github.com/user/project/pull/id/commits/id
   Here are some links to try out the tool!
   - https://github.com/danilofes/refactoring-toy-example/commit/63cbed99a601e79c6a0ae389b2a57acdbd3e1b44
   - https://github.com/danilofes/refactoring-toy-example/commit/36287f7c3b09eff78395267a3ac0d7da067863fd
   - https://github.com/tsantalis/RefactoringMiner/commit/f096939929d712ecd23e6ca726c6fb4ca903f900
Note: If the tool seems to be running too long, go back to chrome://extensions and reload the service worker(this may go inactive), Reload Page where commit is -> Click on Chrome extension -> Click Generate commit
   
![image](https://github.com/user-attachments/assets/9804278a-1b2e-44a7-bcbc-b3f17d348884)


### Troubleshooting

1.If the extension doesn't seem to be working. Go back to VsCode and check the terminal(where you ran RestServiceApplication.java)
If it says Token not valid. End the process. In the same terminal where you ended the process set the OPENAI_API_KEY in there **${env:OPENAI_API_KEY}="YOUR OPENAI KEY GOES INSIDE HERE"** and then rerun the application in the **same terminal**

This is the terminal where the RestServiceApplication.java runs. End the process set the open key there and then run the file again in the same terminal.
![image](https://github.com/user-attachments/assets/94d061aa-4edc-4eb0-a24c-4c1f7b68c4b9)

2. Make sure to generate a new GitHub token if the backend throws an error with something like this
   ![image](https://github.com/user-attachments/assets/fcc31061-473a-48e9-bac6-f822201aca32)




   


