## Image Search Abstraction Layer
Paul Hoskinson (plhosk@gmail.com)

- [Github repository](https://github.com/plhosk/image-search)
- [Try it live on Heroku](https://image-search-plhosk.herokuapp.com/)

### User Stories
- I can get the image URLs, alt text and page urls for a set of images relating to a given search string.
- I can paginate through the responses by adding a ?offset=20 parameter to the URL.
- I can get a list of the most recently submitted search strings.

### Usage
- Image search for "sail boat": `/api/imagesearch/sail+boat`
- Page 2 of above results (20 results per page): `/api/imagesearch/sail+boat?offset=20`
- See the 10 most recent search requests: `/api/latest/imagesearch`
- Results are returned in JSON format.

### Technologies
- Node
- Express
- MongoDB
- Microsoft Cognitive Services Search API
