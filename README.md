<<<<<<< HEAD
# IntownLocal Mobile App

A professional React Native mobile app built with Expo for local shopping and savings.

## Features

### Implemented Features ✅

1. **Authentication Flow**
   - Splash screen with branding
   - Location permission request
   - Mobile number login with OTP
   - Mock OTP verification (use 1234 for testing)
   - User session management

2. **Dashboard**
   - User profile display (name & phone)
   - Large search box for categories/shops
   - Popular categories grid (Grocery, Salon, Restaurant, etc.)
   - Subscription plans display (IT Max & IT Max Plus)
   - Estimated savings calculation
   - Find Nearby Shops button

3. **Map & Shop Discovery**
   - Google Maps integration
   - User location marker
   - Shop markers on map
   - Distance calculation from user location
   - Category filtering
   - Route display (polyline from user to shop)
   - Horizontal scrollable shop list
   - Shop selection with visual feedback

4. **Shop Details**
   - Shop information display
   - Distance and address
   - Map with route visualization
   - Merchant savings information
   - Pay Now button

5. **Payment Flow**
   - Payment summary with savings
   - Multiple payment methods (UPI, Card, Net Banking, Wallet)
   - Mock payment processing
   - Transaction confirmation

## Tech Stack

### Frontend
- **Expo** (React Native framework)
- **React Native** (v0.79.5)
- **Expo Router** (File-based routing)
- **React Native Maps** (Google Maps integration)
- **Zustand** (State management)
- **Axios** (API calls)
- **AsyncStorage** (Local storage)
- **TypeScript**

### Backend
- **FastAPI** (Python web framework)
- **MongoDB** (Database)
- **Motor** (Async MongoDB driver)
- **Pydantic** (Data validation)

## Testing Guide

### Backend Testing
All backend endpoints are working correctly:
```bash
# Test OTP sending
curl -X POST http://localhost:8001/api/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'

# Test OTP verification (use OTP: 1234)
curl -X POST http://localhost:8001/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","otp":"1234"}'

# Test getting shops
curl -X GET "http://localhost:8001/api/shops?lat=12.9716&lng=77.5946"
```

### Frontend Testing (Expo Go)

1. Install Expo Go on your mobile device
2. Scan the QR code displayed
3. Test the complete flow:
   - Splash screen → Location permission → Login → OTP (use 1234) → Dashboard → Map → Shop Details → Payment

## Mock Services

- **OTP**: Always use **1234** for testing
- **Payment**: All transactions are mocked
- **Shops**: 8 dummy shops in Bangalore area

## Google Maps API Key
Configured in app.json: `AIzaSyBo3BuGtZ92gvUzyEDIWp4SXVbIxT28LNY`
=======
# IntownNewApp



## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

- [ ] [Create](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#create-a-file) or [upload](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#upload-a-file) files
- [ ] [Add files using the command line](https://docs.gitlab.com/topics/git/add_files/#add-files-to-a-git-repository) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://gitlab.com/uma.menda/intownnewapp.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

- [ ] [Set up project integrations](https://gitlab.com/uma.menda/intownnewapp/-/settings/integrations)

## Collaborate with your team

- [ ] [Invite team members and collaborators](https://docs.gitlab.com/ee/user/project/members/)
- [ ] [Create a new merge request](https://docs.gitlab.com/ee/user/project/merge_requests/creating_merge_requests.html)
- [ ] [Automatically close issues from merge requests](https://docs.gitlab.com/ee/user/project/issues/managing_issues.html#closing-issues-automatically)
- [ ] [Enable merge request approvals](https://docs.gitlab.com/ee/user/project/merge_requests/approvals/)
- [ ] [Set auto-merge](https://docs.gitlab.com/user/project/merge_requests/auto_merge/)

## Test and Deploy

Use the built-in continuous integration in GitLab.

- [ ] [Get started with GitLab CI/CD](https://docs.gitlab.com/ee/ci/quick_start/)
- [ ] [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/ee/user/application_security/sast/)
- [ ] [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/ee/topics/autodevops/requirements.html)
- [ ] [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/ee/user/clusters/agent/)
- [ ] [Set up protected environments](https://docs.gitlab.com/ee/ci/environments/protected_environments.html)

***

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
>>>>>>> f93aa241df7bbfceac7a51674a8d711edd857dcf
