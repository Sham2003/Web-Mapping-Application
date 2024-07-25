# Web Mapping Application
This project is an interactive mapping application built using Angular, Leaflet, and Terra Draw. It provides various features for map creation, editing, and management, including layers control, drawing tools, and persistent map storage.

## Features

- **Popup Editing:**
  - Edit map information such as name and description.
  - Update layer information with ease using intuitive popups.

- **UI Control for Layer Management:**
  - Display and manage groups of markers and shapes using a UI control.
  - Easily toggle visibility and manage layers of different map elements.

- **Draw Control:**
  - Add various shapes and markers to the map, including:
    - **Markers**: Place location-specific markers on the map.
    - **Shapes**: Draw and customize shapes such as PolyLine, Polygon, Circle, Rectangle, and Freehand.
  - Comprehensive draw control to facilitate map annotations.

- **Edit Mode:**
  - Edit the geometry of shapes that have already been drawn.
  - Modify the size, position, and shape of existing map elements with precision.

- **Main Page with Map Management:**
  - View a list of maps that have already been created.
  - Create, delete, and manage maps directly from the main page.
  - Maps are stored in local storage and updated synchronously for a seamless user experience.

## Installation

To set up the project locally, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <repository-directory>


2. **Install dependencies:**

    ```bash
    Copy code
    npm install


3. **Run the application:**

    ```bash
    Copy code
    ng serve


4. **Access the application:**

    Open your browser and navigate to http://localhost:4200.


## Usage


    Use the Draw Control to add and customize markers and shapes on the map.
    
    Access the Popup functionality to edit map and layer information.
    
    Utilize the UI Control to manage visibility and grouping of map elements.
    
    Enter Edit Mode to make changes to existing shapes and markers.
    
    Navigate the Main Page to manage your created maps, including creation and deletion.


## Technologies Used
    - **Angular**   : Framework for building the web application.
    - **Leaflet**   : JavaScript library for interactive maps.
    - **Terra Draw**: Tool for enhanced drawing and editing capabilities.




