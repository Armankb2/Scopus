
 🧠 Scopus & Google Scholar Data Fetcher

A Python project that automatically extracts faculty publication details from Scopus and Google Scholar, merges the results, and stores them in a local SQLite database (scholar.db).

This tool is designed for institutions, research groups, or individuals who want to quickly generate accurate publication metadata for multiple authors.



 🚀 Features

 ✓ Fetch publication details using:

 Scopus API (via requests)
 Google Scholar scraping (via scholarly)

 ✓ Automatically extracts:

 Title
 Authors
 Journal/Conference Name
 Volume / Issue / Pages
 DOI
 Publisher
 Citation Count
 Scopusindexed status
 Online link

 ✓ Saves output to:

 SQLite Database (scholar.db)
 CSV if required
 Terminal logs for debugging

 ✓ Easy configuration using:

 config.py
 .env file for secrets (API keys)






 🔧 Installation

 1. Clone the repository

bash
git clone https://github.com/Armankb2/Scopus.git
cd Scopus


 2. Create a virtual environment

bash
python3 m venv venv
source venv/bin/activate      macOS / Linux
venv\Scripts\activate         Windows


 3. Install dependencies

bash
pip install r requirements.txt




 🔑 Setup API Keys (IMPORTANT)

Create a .env file in the project root:


SCOPUS_API_KEY=your_scopus_key_here
GOOGLE_SCHOLAR_EMAIL=optional_email_here


Your .gitignore already protects this file — no secrets will be uploaded to GitHub.



 ▶️ Usage

 Option 1 — Run the main script normally

bash
python 00.py


This will:

 Load faculty names from faculty_list.csv
 Fetch data from Scopus & Google Scholar
 Store results in scholar.db
 Print logs of progress in the terminal

 Option 2 — Run a specific module

bash
python tt.py
python 102.py




 🗂 Output

 The script creates/updates:

 scholar.db – SQLite database containing publication entries
 Console logs showing success / warnings / failures

Each entry stored includes:

| Field                  | Description         |
|  |  |
| Title                  | Publication title   |
| Authors                | List of authors     |
| Journal/Conference     | Source              |
| Volume / Issue / Pages | Metadata            |
| DOI                    | Unique identifier   |
| Publisher              | Name of publisher   |
| Citations              | Number of citations |
| Online Link            | Direct URL          |
| Scopus Indexed         | Yes/No              |
| Date                   | Publication date    |



 🧪 Testing & Debugging

Enable verbose mode inside 00.py by uncommenting debug print statements:

python
print("Fetching data for:", author_name)


Run tests with:

bash
python tt.py




 🛠 Technologies Used

 Python 3
 Requests
 BeautifulSoup4
 SQLAlchemy
 Scholarly
 SQLite



 🤝 Contributing

Pull requests are welcome!
To contribute:

bash
git checkout b featurename
git commit m "Added new feature"
git push origin featurename





