# FreshCart — UML Class Diagram

This document presents the class diagram showing the main data structures of FreshCart and their relationships.

---

## Description

The FreshCart data model is built around a central `User` entity. Each user can have many `CartItem` entries representing their current shopping session, many `Order` records representing their purchase history, many `Favorite` entries for saved products, and many `RefreshToken` entries for JWT session management.

Each `Order` contains many `OrderItem` entries, each linked to a `Product`. Products belong to categories and can have a discount percentage applied. Cart items and order items both reference the `Product` entity directly.

---

## Class Diagram

```mermaid
classDiagram
    class User {
        +int id
        +string username
        +string email
        +string password_hash
        +string first_name
        +string last_name
        +string phone_number
        +string billing_address
        +string billing_zip_code
        +string billing_city
        +string billing_country
        +string role
        +datetime created_at
        +datetime updated_at
    }

    class Product {
        +int id
        +string name
        +decimal price
        +string description
        +string brand
        +string picture
        +string category
        +string barcode
        +string nutrition_grade
        +json nutritional_info
        +int quantity
        +decimal discount_percentage
        +datetime created_at
        +datetime updated_at
    }

    class CartItem {
        +int id
        +int user_id
        +int product_id
        +int quantity
        +datetime created_at
        +datetime updated_at
    }

    class Order {
        +int id
        +int user_id
        +string order_number
        +decimal subtotal
        +decimal tax_rate
        +decimal tax_amount
        +decimal shipping_fee
        +decimal total_amount
        +string status
        +string payment_method
        +string delivery_address
        +string customer_name
        +string customer_email
        +string notes
        +datetime created_at
        +datetime updated_at
    }

    class OrderItem {
        +int id
        +int order_id
        +int product_id
        +int quantity
        +decimal unit_price
        +decimal line_total
        +string product_name
        +string product_picture
        +datetime created_at
        +datetime updated_at
    }

    class Favorite {
        +int id
        +int user_id
        +int product_id
        +datetime created_at
    }

    class RefreshToken {
        +int id
        +int userId
        +string token
        +datetime expiresAt
        +datetime createdAt
        +datetime updatedAt
    }

    class ScanEvent {
        +int id
        +int user_id
        +string barcode
        +string status
        +string message
        +datetime created_at
    }

    User "1" --> "0..*" CartItem : has
    User "1" --> "0..*" Order : places
    User "1" --> "0..*" Favorite : saves
    User "1" --> "0..*" RefreshToken : owns
    User "1" --> "0..*" ScanEvent : triggers

    Order "1" --> "1..*" OrderItem : contains
    CartItem "0..*" --> "1" Product : references
    OrderItem "0..*" --> "1" Product : references
    Favorite "0..*" --> "1" Product : references
```

---

## Relationships Summary

| Relationship | Type | Description |
|---|---|---|
| User → CartItem | One to many | A user has multiple items in their cart |
| User → Order | One to many | A user can place multiple orders |
| User → Favorite | One to many | A user can save multiple favorite products |
| User → RefreshToken | One to many | A user can have multiple active sessions |
| User → ScanEvent | One to many | Each barcode scan is logged per user |
| Order → OrderItem | One to many | Each order contains one or more items |
| CartItem → Product | Many to one | Multiple cart items can reference the same product |
| OrderItem → Product | Many to one | Multiple order items can reference the same product |
| Favorite → Product | Many to one | Multiple users can favorite the same product |
