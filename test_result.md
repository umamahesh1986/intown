#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Fix logout functionality for Member and Merchant dashboards. When users click logout,
  they should be completely logged out and redirected to the mobile number login screen.
  Previously, logout was not properly clearing AsyncStorage, causing users to be
  auto-logged back in when the app reloaded.

backend:
  - task: "Backend API endpoints"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Backend APIs are stable and not affected by logout fix"

frontend:
  - task: "Logout functionality - Member Dashboard"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/member-dashboard.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "user"
        comment: "User reported logout not working properly - users not redirected to login screen"
      - working: "NA"
        agent: "main"
        comment: |
          Fixed logout implementation:
          - Added Alert confirmation dialog
          - Ensured AsyncStorage.clear() is called to remove all stored data
          - Properly await logout() from authStore
          - Use router.replace('/login') for navigation
          - Added error handling with fallback navigation

  - task: "Logout functionality - Merchant Dashboard"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/merchant-dashboard.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "user"
        comment: "User reported logout not working properly for merchant flow"
      - working: "NA"
        agent: "main"
        comment: |
          Verified logout implementation was already correct:
          - Has Alert confirmation dialog
          - Calls AsyncStorage.clear()
          - Properly awaits logout() from authStore
          - Uses router.replace('/login')
          - Has error handling with fallback navigation

  - task: "AuthStore logout function"
    implemented: true
    working: true
    file: "/app/frontend/store/authStore.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          AuthStore logout is properly implemented:
          - Removes auth_token from AsyncStorage
          - Removes user_data from AsyncStorage
          - Resets state (user: null, token: null, isAuthenticated: false)

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "Logout functionality - Member Dashboard"
    - "Logout functionality - Merchant Dashboard"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Implemented logout fix for both Member and Merchant dashboards.
      
      Changes made:
      1. Updated member-dashboard.tsx to include Alert confirmation before logout
      2. Ensured AsyncStorage.clear() is called in both dashboards
      3. Both dashboards now follow the same logout pattern
      
      Testing needed:
      - Test logout from Member Dashboard (after Member registration)
      - Test logout from Merchant Dashboard (after Merchant registration)
      - Verify users are redirected to /login screen
      - Verify users cannot auto-login after logout (AsyncStorage cleared)
      - Test that after logout, the app redirects to /location then /login
      
      The fix addresses the root cause:
      - AsyncStorage was not being completely cleared
      - The _layout.tsx calls loadAuth() on mount, which reloads data from AsyncStorage
      - By clearing all AsyncStorage data, we ensure no stale auth data remains