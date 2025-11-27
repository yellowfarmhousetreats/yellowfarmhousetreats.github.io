import sys
import json
import shutil
from pathlib import Path
from typing import List, Dict, Optional, Any, TypedDict, Union, cast

from PyQt6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                              QHBoxLayout, QLabel, QPushButton, QFileDialog, 
                              QLineEdit, QScrollArea, QGridLayout, QMessageBox)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QDragEnterEvent, QDropEvent, QMouseEvent, QDragLeaveEvent


# Define TypedDicts
class ProductImages(TypedDict, total=False):
    primary: str

class ProductDict(TypedDict, total=False):
    name: str
    sizes: List[str]
    sizePrice: Dict[str, int]
    canGlutenfree: bool
    canSugarfree: bool
    category: str
    canShip: bool
    weight: Union[int, float]
    image: str
    ingredients: str
    allergens: List[str]
    dietaryNotes: str
    subcategory: str
    hasDeposit: bool
    depositAmount: int
    canGiftWrap: bool
    giftWrapPrice: int
    # Fields used by renamer logic
    id: str
    images: Dict[str, str]

class DropZoneData(TypedDict):
    zone: 'DropZone'
    expected: str


class DropZone(QLabel):
    """Drag-and-drop zone for product images"""
    
    def __init__(self, product_name: str, expected_filename: str, parent: Optional[QWidget] = None) -> None:
        super().__init__(parent)
        self.product_name: str = product_name
        self.expected_filename: str = expected_filename
        self.dropped_file: Optional[str] = None
        
        self.setAcceptDrops(True)
        self.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.setStyleSheet("""
            QLabel {
                border: 2px dashed #21808d;
                border-radius: 8px;
                background-color: rgba(33, 128, 141, 0.05);
                padding: 40px 20px;
                min-height: 120px;
                color: #626c71;
            }
            QLabel:hover {
                background-color: rgba(33, 128, 141, 0.15);
                border-color: #1d7480;
            }
        """)
        self.setText("Drop image here\nor click to select")
        self.setWordWrap(True)
        
    def dragEnterEvent(self, a0: Optional[QDragEnterEvent]) -> None:
        if not a0:
            return
        mime_data = a0.mimeData()
        if mime_data and mime_data.hasUrls():
            a0.acceptProposedAction()
            self.setStyleSheet("""
                QLabel {
                    border: 3px solid #21808d;
                    border-radius: 8px;
                    background-color: rgba(33, 128, 141, 0.2);
                    padding: 40px 20px;
                    min-height: 120px;
                    color: #13343b;
                }
            """)
    
    def dragLeaveEvent(self, a0: Optional[QDragLeaveEvent]) -> None:
        if not a0:
            return
        self.setStyleSheet("""
            QLabel {
                border: 2px dashed #21808d;
                border-radius: 8px;
                background-color: rgba(33, 128, 141, 0.05);
                padding: 40px 20px;
                min-height: 120px;
                color: #626c71;
            }
        """)
    
    def dropEvent(self, a0: Optional[QDropEvent]) -> None:
        if not a0:
            return
        mime_data = a0.mimeData()
        if not mime_data:
            return
            
        urls = mime_data.urls()
        if urls:
            file_path = urls[0].toLocalFile()
            if file_path.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                self.dropped_file = file_path
                self.setText(f"✓ {Path(file_path).name}\n→ {self.expected_filename}")
                self.setStyleSheet("""
                    QLabel {
                        border: 2px solid #21808d;
                        border-radius: 8px;
                        background-color: rgba(33, 128, 141, 0.1);
                        padding: 40px 20px;
                        min-height: 120px;
                        color: #21808d;
                        font-weight: bold;
                    }
                """)
            else:
                QMessageBox.warning(self, "Invalid File", "Please drop an image file (jpg, png, webp)")
    
    def mousePressEvent(self, ev: Optional[QMouseEvent]) -> None:
        if not ev:
            return
        file_path, _ = QFileDialog.getOpenFileName(
            self,
            "Select Image",
            "",
            "Images (*.jpg *.jpeg *.png *.webp)"
        )
        if file_path:
            self.dropped_file = file_path
            self.setText(f"✓ {Path(file_path).name}\n→ {self.expected_filename}")
            self.setStyleSheet("""
                QLabel {
                    border: 2px solid #21808d;
                    border-radius: 8px;
                    background-color: rgba(33, 128, 141, 0.1);
                    padding: 40px 20px;
                    min-height: 120px;
                    color: #21808d;
                    font-weight: bold;
                }
            """)


class ImageRenamerApp(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self.products: List[ProductDict] = []
        self.drop_zones: Dict[str, DropZoneData] = {}
        self.output_folder: Optional[str] = None
        
        self.setWindowTitle("Image Renamer - FarmBakeGo")
        self.setMinimumSize(1000, 700)
        
        # Main widget and layout
        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        layout = QVBoxLayout(main_widget)
        layout.setSpacing(16)
        layout.setContentsMargins(24, 24, 24, 24)
        
        # Header
        header = QLabel("Product Image Renamer")
        header.setStyleSheet("font-size: 28px; font-weight: bold; color: #13343b;")
        layout.addWidget(header)
        
        subtitle = QLabel("Load JSON, drop images, export to local folder")
        subtitle.setStyleSheet("font-size: 14px; color: #626c71; margin-bottom: 16px;")
        layout.addWidget(subtitle)
        
        # JSON file selection
        json_layout = QHBoxLayout()
        json_label = QLabel("1. Products JSON:")
        json_label.setStyleSheet("font-weight: bold;")
        self.json_path_display = QLineEdit()
        self.json_path_display.setReadOnly(True)
        self.json_path_display.setPlaceholderText("No file selected")
        json_btn = QPushButton("Browse JSON")
        json_btn.clicked.connect(self.load_json) # type: ignore
        json_layout.addWidget(json_label)
        json_layout.addWidget(self.json_path_display)
        json_layout.addWidget(json_btn)
        layout.addLayout(json_layout)
        
        # Output folder selection
        folder_layout = QHBoxLayout()
        folder_label = QLabel("2. Output Folder:")
        folder_label.setStyleSheet("font-weight: bold;")
        self.folder_path_display = QLineEdit()
        self.folder_path_display.setPlaceholderText("/path/to/your/repo/images")
        folder_btn = QPushButton("Select Folder")
        folder_btn.clicked.connect(self.select_output_folder) # type: ignore
        folder_layout.addWidget(folder_label)
        folder_layout.addWidget(self.folder_path_display)
        folder_layout.addWidget(folder_btn)
        layout.addLayout(folder_layout)
        
        # Products grid (scrollable)
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setStyleSheet("QScrollArea { border: none; }")
        
        self.products_widget = QWidget()
        self.products_layout = QGridLayout(self.products_widget)
        self.products_layout.setSpacing(16)
        scroll.setWidget(self.products_widget)
        layout.addWidget(scroll)
        
        # Export button
        self.export_btn = QPushButton("Export All Images")
        self.export_btn.setEnabled(False)
        self.export_btn.setStyleSheet("""
            QPushButton {
                background-color: #21808d;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: bold;
                font-size: 14px;
            }
            QPushButton:hover {
                background-color: #1d7480;
            }
            QPushButton:disabled {
                background-color: #626c71;
                color: #a7a9a9;
            }
        """)
        self.export_btn.clicked.connect(self.export_images) # type: ignore
        layout.addWidget(self.export_btn)
    
    def load_json(self, checked: bool = False) -> None:
        file_path, _ = QFileDialog.getOpenFileName(
            self,
            "Select Products JSON",
            "",
            "JSON Files (*.json)"
        )
        
        if not file_path:
            return
        
        try:
            with open(file_path, 'r') as f:
                data: Any = json.load(f)
            
            loaded_products: List[ProductDict] = []
            
            # Handle both list and dict root elements
            if isinstance(data, list):
                loaded_products = cast(List[ProductDict], data)
            elif isinstance(data, dict):
                # Explicitly cast to Dict[str, Any] to satisfy strict mode for .get()
                data_dict = cast(Dict[str, Any], data)
                loaded_products = cast(List[ProductDict], data_dict.get('products', []))
            else:
                QMessageBox.warning(self, "Invalid JSON", "JSON root must be a list or a dict containing 'products'.")
                return
            
            self.products = loaded_products
            
            if not self.products:
                QMessageBox.warning(self, "No Products", "No products found in JSON file.")
                return
            
            self.json_path_display.setText(file_path)
            self.render_products()
            
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to load JSON: {str(e)}")
    
    def render_products(self) -> None:
        # Clear existing widgets
        for i in reversed(range(self.products_layout.count())):
            item = self.products_layout.itemAt(i)
            if item:
                widget = item.widget()
                if widget:
                    widget.setParent(None)
        
        self.drop_zones.clear()
        
        # Create product cards in grid
        for idx, product in enumerate(self.products):
            self.create_product_card(product, idx)
        
        self.export_btn.setEnabled(True)

    def create_product_card(self, product: ProductDict, idx: int) -> None:
        row = idx // 3
        col = idx % 3
        
        # Product card container
        card = QWidget()
        card.setStyleSheet("""
            QWidget {
                background-color: #fffffe;
                border: 1px solid rgba(94, 82, 64, 0.2);
                border-radius: 12px;
                padding: 16px;
            }
        """)
        card_layout = QVBoxLayout(card)
        card_layout.setSpacing(8)
        
        # Product name
        name_label = QLabel(product.get('name', 'Unnamed Product'))
        name_label.setStyleSheet("font-weight: bold; font-size: 16px;")
        name_label.setWordWrap(True)
        card_layout.addWidget(name_label)
        
        # Expected filename
        # Logic: try images.primary, else fallback to product-{idx}.jpg
        images = product.get('images', {})
        # images is typed as Dict[str, str] in ProductDict, so we can safely use .get
        expected_filename = images.get('primary', f"product-{idx}.jpg")
        
        filename_label = QLabel(f"→ {expected_filename}")
        filename_label.setStyleSheet("font-family: 'Courier New'; font-size: 13px; color: #626c71;")
        card_layout.addWidget(filename_label)
        
        # Drop zone
        drop_zone = DropZone(product.get('name', ''), expected_filename)
        card_layout.addWidget(drop_zone)
        
        # Store metadata
        product_id = product.get('id', f'product-{idx}')
        self.drop_zones[product_id] = {
            'zone': drop_zone,
            'expected': expected_filename
        }
        
        self.products_layout.addWidget(card, row, col)
    
    def select_output_folder(self, checked: bool = False) -> None:
        folder = QFileDialog.getExistingDirectory(self, "Select Output Folder")
        if folder:
            self.output_folder = folder
            self.folder_path_display.setText(folder)
    
    def export_images(self, checked: bool = False) -> None:
        if not self.output_folder:
            QMessageBox.warning(self, "No Folder", "Please select an output folder first.")
            return
        
        output_path = Path(self.output_folder)
        if not output_path.exists():
            QMessageBox.warning(self, "Invalid Folder", "Selected folder does not exist.")
            return
        
        exported_count = 0
        
        for _, data in self.drop_zones.items():
            drop_zone = data['zone']
            expected_filename = data['expected']
            
            if drop_zone.dropped_file:
                try:
                    source = Path(drop_zone.dropped_file)
                    destination = output_path / expected_filename
                    
                    shutil.copy2(source, destination)
                    exported_count += 1
                    
                except Exception as e:
                    QMessageBox.warning(self, "Export Error", f"Failed to copy {expected_filename}: {str(e)}")
        
        if exported_count > 0:
            QMessageBox.information(
                self, 
                "Export Complete", 
                f"{exported_count} image{'s' if exported_count != 1 else ''} exported to:\n{self.output_folder}"
            )
            
            # Reset drop zones
            for data in self.drop_zones.values():
                zone = data['zone']
                zone.dropped_file = None
                zone.setText("Drop image here\nor click to select")
                zone.setStyleSheet("""
                    QLabel {
                        border: 2px dashed #21808d;
                        border-radius: 8px;
                        background-color: rgba(33, 128, 141, 0.05);
                        padding: 40px 20px;
                        min-height: 120px;
                        color: #626c71;
                    }
                """)
        else:
            QMessageBox.information(self, "No Images", "No images were dropped. Add images first.")


def main() -> None:
    app = QApplication(sys.argv)
    window = ImageRenamerApp()
    window.show()
    sys.exit(app.exec())


if __name__ == '__main__':
    main()
