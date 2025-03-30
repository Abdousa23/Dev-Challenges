from ariadne import ObjectType, QueryType, gql, make_executable_schema
from ariadne.asgi import GraphQL
from flask import Flask, jsonify, render_template

USERS = {
    "1": {
        "id": "1",
        "username": "johndoe",
        "email": "john@example.com",
        "full_name": "John Doe",
        "address": "123 Main St, Anytown, USA",
        "phone": "555-123-4567",
        "date_joined": "2023-01-15T08:30:00Z",
        "last_login": "2025-03-28T14:22:10Z",
        "premium_status": True,
        "profile_picture": "https://example.com/profiles/johndoe.jpg",
        "preferences": {
            "theme": "dark",
            "language": "en-US",
            "notifications": {
                "email": True,
                "sms": False,
                "push": True
            }
        },
        "payment_info": {
            "card_type": "Visa",
            "last_four": "4242",
            "expiry": "12/27"
        },
        "order_history": [
            {"id": "ord-123", "date": "2025-03-12T10:24:00Z", "total": 89.99},
            {"id": "ord-117", "date": "2025-02-28T15:16:32Z", "total": 42.50},
            {"id": "ord-098", "date": "2025-01-15T12:03:45Z", "total": 125.00}
        ]
    },
    "2": {
        "id": "2",
        "username": "janedoe",
        "email": "jane@example.com",
        "full_name": "Jane Doe",
        "address": "456 Oak Ave, Somewhere, USA",
        "phone": "555-987-6543",
        "date_joined": "2023-02-20T10:15:00Z",
        "last_login": "2025-03-27T09:10:05Z",
        "premium_status": False,
        "profile_picture": "https://example.com/profiles/janedoe.jpg",
        "preferences": {
            "theme": "light",
            "language": "en-GB",
            "notifications": {
                "email": True,
                "sms": True,
                "push": False
            }
        },
        "payment_info": {
            "card_type": "Mastercard",
            "last_four": "9876",
            "expiry": "08/26"
        },
        "order_history": [
            {"id": "ord-145", "date": "2025-03-20T16:42:00Z", "total": 23.99},
            {"id": "ord-132", "date": "2025-03-05T13:27:14Z", "total": 67.25}
        ]
    }
}
app = Flask(__name__)

# Define your types
type_defs = gql("""
    type User {
        id: String!
        username: String!
        email: String!
        full_name: String!
        address: String
        phone: String
        profile_picture: String
        preferences: Preferences
    }
    
    type Preferences {
        theme: String!
        language: String!
        notifications: NotificationPreferences!
    }
    
    type NotificationPreferences {
        email: Boolean!
        sms: Boolean!
        push: Boolean!
    }
    
    type Query {
        user(id: String!): User
    }
""")

query = QueryType()

@query.field("user")
def resolve_user(_, info, id):
    return USERS.get(id)

schema = make_executable_schema(type_defs, query)
