import { PersistentUnorderedMap } from "near-sdk-as";
import { ContractPromiseBatch, context, u128, logging } from 'near-sdk-as';
import { Product, listedProducts } from './model';

// Persistent storage for products
export const products = new PersistentUnorderedMap<string, string>("PRODUCTS");

// Function to add a new product
export function setProduct(product: Product): void {
    // Check if a product with the given ID already exists
    let storedProduct = listedProducts.get(product.id);
    if (storedProduct !== null) {
        throw new Error(`A product with ID ${product.id} already exists`);
    }

    // Add the new product to the listedProducts map
    listedProducts.set(product.id, Product.fromPayload(product));
}

// Function to get a product by ID
export function getProduct(id: string): Product | null {
    return listedProducts.get(id);
}

// Function to get all products
export function getProducts(): Product[] {
    return listedProducts.values();
}

// Function to get the number of products
export function getProductslength(): number {
    return listedProducts.values().length;
}

// Function to buy a product
export function buyProduct(productId: string): void {
    const product = getProduct(productId);

    // Check if the product exists
    if (product === null) {
        throw new Error("Product not found");
    }

    // Check if the product is available for purchase
    if (product.available === false) {
        throw new Error("Product has finished");
    }

    // Check if the attached deposit matches the product's price
    if (product.price.toString() !== context.attachedDeposit.toString()) {
        throw new Error("Attached deposit should equal the product's price");
    }

    // Transfer funds to the product owner
    ContractPromiseBatch.create(product.owner).transfer(context.attachedDeposit);

    // Update product state after successful purchase
    product.incrementSoldAmount();
    product.updateAvailability();
    listedProducts.set(product.id, product);
}

// Function to delete a product
export function deleteProduct(id: string): void {
    let product = listedProducts.get(id);

    // Check if the product exists
    if (product === null) {
        throw new Error(`Product ${id} does not exist`);
    }

    // Check if the sender is the owner of the product
    if (context.sender !== product.owner) {
        throw new Error(`You are not the product owner`);
    }

    // Delete the product
    listedProducts.delete(id);
}

// Function to update product information
export function updateProduct(
    id: string,
    _name: string,
    _description: string,
    _image: string,
    _location: string,
    _price: u128,
    _supply: u32
): void {
    const product = listedProducts.get(id);

    // Check if the product exists
    if (product === null) {
        throw new Error("Product not found");
    }

    // Validate input values
    assert(_description.length > 0, "Empty description");
    assert(_location.length > 0, "Invalid location");
    assert(_image.length > 0, "Invalid image url");
    assert(_name.length > 0, "Empty name");
    assert(_supply > 0, "Enter value greater than zero");

    // Update product information
    product.name = _name;
    product.description = _description;
    product.image = _image;
    product.location = _location;
    product.price = _price;
    product.supply = _supply;

    // Save the updated product information
    listedProducts.set(product.id, product);
}
