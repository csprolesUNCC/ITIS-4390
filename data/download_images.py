import requests
import json
import os
import urllib.parse

PEXELS_API_KEY = "Hdwr2R9pN9CD1ldiHLdOfrs5iGswDkyDu0yu54HauOjjvtLbZ32VHCIT" 
PRODUCTS_FILE = "products.json"
IMAGES_OUTPUT_DIR = "img"


def get_image_url(query, orientation="square"):
    """Searches for an image on Pexels and returns the download URL."""
    if not PEXELS_API_KEY or PEXELS_API_KEY == "YOUR_PEXELS_API_KEY_HERE":
        print("Error: Pexels API key is not set.")
        return None

    headers = {"Authorization": PEXELS_API_KEY}
    #Use  name and category for a better search 
    encoded_query = urllib.parse.quote(query)
    url = f"https://api.pexels.com/v1/search?query={encoded_query}&orientation={orientation}&per_page=1"

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raises an HTTPError for bad responses 
        data = response.json()
        photos = data.get('photos', [])
        if photos:
            # Get  medium-sized image
            return photos[0]['src']['medium']
    except requests.exceptions.RequestException as e:
        print(f"Error fetching image for query '{query}': {e}")
    return None

def main():
    # Create the output directory if it doesn't exist
    if not os.path.exists(IMAGES_OUTPUT_DIR):
        os.makedirs(IMAGES_OUTPUT_DIR)

    # Load products from JSON 
    with open(PRODUCTS_FILE, 'r') as f:
        data = json.load(f)

    updated_products = []
    for product in data.get("products", []):
        product_id = product.get("id")
        product_name = product.get("name")
        category_slug = product.get("category_name", "product").lower().replace(" & ", "-").replace(" ", "-")
        
        # Create a search query
        search_query = f"{product_name} {category_slug}"
        
        # Define a unused filename
        filename_base = product_name.lower().replace(" ", "_").replace(",", "").replace("&", "and")
        image_filename = f"{category_slug}/{filename_base}.jpg"
        image_path = os.path.join(IMAGES_OUTPUT_DIR, image_filename)
        
        # Create sub-directory for category
        category_dir = os.path.join(IMAGES_OUTPUT_DIR, category_slug)
        if not os.path.exists(category_dir):
            os.makedirs(category_dir)

        print(f"Processing Product ID {product_id}: {product_name}...")
        
        # check if image exists
        if not os.path.exists(image_path):
            image_url = get_image_url(search_query)
            #if not
            if image_url:
                try:
                    # download the image
                    img_data = requests.get(image_url).content
                    with open(image_path, 'wb') as img_file:
                        img_file.write(img_data)
                    print(f"  -> SUCCESS: Downloaded to {image_path}")
                except requests.exceptions.RequestException as e:
                    print(f"  -> ERROR: Could not download image from {image_url}. {e}")
                    image_url = None # Fallback to original if download fails
            else:
                print("  -> FAILED: No image found on Pexels.")
                # keep original file if no new image is found
                image_url = product.get("image_url")
        else:
            print(f"  -> SKIPPED: Image already exists at {image_path}")
        
        # Uudate the product's image_url to point to local file (extra safety)
        product['image_url'] = f"/{image_path}"
        updated_products.append(product)

    # Save the updated JSON 
    data['products'] = updated_products
    with open(PRODUCTS_FILE, 'w') as f:
        json.dump(data, f, indent=2)
        
    print("\n--- Process Complete ---")
    print(f"Your '{PRODUCTS_FILE}' has been updated with local image paths.")
    print(f"Images have been saved in the '{IMAGES_OUTPUT_DIR}' directory.")


if __name__ == "__main__":
    main()