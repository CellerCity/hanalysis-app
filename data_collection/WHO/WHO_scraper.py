import requests
import json
import re
from bs4 import BeautifulSoup

# --- Configuration ---

# The main A-Z directory page for all fact sheets
DIRECTORY_URL = "https://www.who.int/news-room/fact-sheets"

# The base URL to build absolute links
BASE_URL = "https://www.who.int"

# A User-Agent header helps avoid being blocked (makes us look like a browser)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

# --- Main Functions ---

def get_fact_sheet_links():
    """
    Fetches the main directory page and scrapes all links to individual fact sheets.
    """
    print(f"Fetching directory page: {DIRECTORY_URL}")
    try:
        response = requests.get(DIRECTORY_URL, headers=HEADERS)
        response.raise_for_status()  # Raise an error for bad responses (404, 500, etc.)
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        links = []
        # This is the robust way to find links:
        # We find ALL <a> tags and filter them based on their URL structure.
        for a_tag in soup.find_all("a", href=True):
            href = a_tag['href']
            # We only want links that point to a fact sheet detail page
            if href.startswith("/news-room/fact-sheets/detail/"):
                full_url = BASE_URL + href
                if full_url not in links:
                    links.append(full_url)
                    
        print(f"Found {len(links)} unique fact sheet links.")
        return links
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching directory page: {e}")
        return []

def scrape_and_chunk_page(url):
    """
    Scrapes a single fact sheet URL, chunks its content based on headings,
    and returns a list of dictionaries for the RAG system.
    """
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Get the main topic/title of the page
        title_tag = soup.find("h1")
        topic = title_tag.get_text(strip=True) if title_tag else "Unknown Topic"
        
        # --- THIS IS THE CORRECTED LINE ---
        # Instead of the generic <main> tag, we find the specific <div>
        # that is marked as the "Body" content container. [cite: 59862, 61700]
        content_area = soup.find("div", attrs={"data-placeholder-label": "Body"})
        
        if not content_area:
            print(f"Warning: Could not find content area for {url}. Skipping.")
            return []

        chunks = []
        current_heading = "Overview"  # Default for content before the first h2
        current_chunk_text = ""

        # Find all relevant tags (headings, paragraphs, list items)
        for element in content_area.find_all(['h2', 'h3', 'p', 'li']):
            
            if element.name == 'h2' or element.name == 'h3':
                # We've hit a new heading. This is a semantic boundary.
                # First, save the previous chunk if it has content.
                if len(current_chunk_text.strip()) > 50: # Only save meaningful chunks
                    
                    # Combine heading + text for full context
                    full_chunk = f"{current_heading}\n{current_chunk_text.strip()}"
                    
                    chunks.append({
                        "topic": topic,
                        "source_url": url,
                        # Clean up multiple newlines
                        "chunk_text": re.sub(r'\n+', '\n', full_chunk)
                    })
                
                # Start a new chunk
                current_heading = element.get_text(strip=True)
                current_chunk_text = "" # Reset the text
            
            else:
                # This is a <p> or <li>. Append its text to the current chunk.
                current_chunk_text += element.get_text(strip=True) + "\n"
        
        # --- Save the very last chunk ---
        # The loop finishes on the last <p>, so we need to save the chunk it was building.
        if len(current_chunk_text.strip()) > 50:
            full_chunk = f"{current_heading}\n{current_chunk_text.strip()}"
            chunks.append({
                "topic": topic,
                "source_url": url,
                "chunk_text": re.sub(r'\n+', '\n', full_chunk)
            })
            
        return chunks

    except requests.exceptions.RequestException as e:
        print(f"Error scraping page {url}: {e}")
        return []

# --- Main execution ---
def main():
    """
    Main function to run the scraper and save the data.
    """
    fact_sheet_links = get_fact_sheet_links()
    
    if not fact_sheet_links:
        print("No links found. Exiting.")
        return

    all_data_chunks = []
    
    # --- IMPORTANT: Add a slice for testing! ---
    # Don't scrape all 200+ pages at once. Test with 5-10.
    # Change `fact_sheet_links[:10]` to `fact_sheet_links` for the full run.
    # links_to_scrape = fact_sheet_links[:10]
    links_to_scrape = fact_sheet_links

    
    total_links = len(links_to_scrape)
    
    for i, link in enumerate(links_to_scrape):
        print(f"[{i+1}/{total_links}] Scraping: {link}")
        chunks = scrape_and_chunk_page(link)
        all_data_chunks.extend(chunks)
        print(f"  > Found {len(chunks)} chunks.")

    # Write the final combined data to a JSON file
    output_filename = "who_facts.json"
    with open(output_filename, 'w', encoding='utf-8') as f:
        json.dump(all_data_chunks, f, indent=2, ensure_ascii=False)
        
    print(f"\nSuccessfully scraped {len(all_data_chunks)} chunks from {total_links} pages.")
    print(f"Data saved to {output_filename}")


if __name__ == "__main__":
    main()