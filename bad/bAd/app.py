from schema import schema, USERS
from ariadne.asgi import GraphQL
from ariadne import QueryType, gql, make_executable_schema
from ariadne import graphql_sync
from flask import Flask, jsonify, render_template, request, json
app = Flask(__name__, static_url_path='', static_folder='static', template_folder='templates')



@app.route("/graphql", methods=["POST"])
def graphql_server():
    data = request.get_json()
    success, result = graphql_sync(
        schema,
        data,
        context_value=request,
        debug=app.debug
    )
    status_code = 200 if success else 400
    return jsonify(result), status_code
@app.route('/')
def index():
    return render_template('index.html')

# All users
@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    
    if user_id in USERS:
        return jsonify(USERS[user_id])
    return jsonify({"error": "User not found"}), 404

# for profile page
@app.route('/api/users/<user_id>/profile', methods=['GET'])
def get_user_profile(user_id):
    if user_id in USERS:
        user_profile = {
            "username": USERS[user_id]["username"],
            "email": USERS[user_id]["email"],
            "full_name": USERS[user_id]["full_name"],
            "profile_picture": USERS[user_id]["profile_picture"]
        }
        return jsonify(user_profile)
    return jsonify({"error": "User not found"}), 404

#  for settings page
@app.route('/api/users/<user_id>/settings', methods=['GET'])
def get_user_settings(user_id):
    if user_id in USERS:
        user_preferences = {
            "username": USERS[user_id]["username"],
            "preferences": {
                "theme": USERS[user_id]["preferences"]["theme"],
                "language": USERS[user_id]["preferences"]["language"],
                "notifications": USERS[user_id]["preferences"]["notifications"]
            }
            }
        return jsonify(user_preferences)
    return jsonify({"error": "User not found"}), 404

if __name__ == '__main__':
    app.run(debug=True)