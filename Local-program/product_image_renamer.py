import sys
import json
import shutil
from pathlib import Path
from PyQt6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                              QHBoxLayout, QLabel, QPushButton, QFileDialog, 
                              QLineEdit, QScrollArea, QGridLayout, QMessageBox)
from PyQt6.QtCore import Qt, QMimeData
from PyQt6.QtGui import QDragEnterEvent, QDropEvent, QPixmap


class DropZone(QLabel):
    """Drag-and-drop zone for product images"""
    
    def __init__(self, product_name, expected_filename, parent=None):
        super().__init__(parent)
        self.product_name = product_name
        self.expected_filename = expected_filename
        self.dropped_file = None
        
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
        
    def dragEnterEvent(self, event: QDragEnterEvent):
        if event.mimeData().hasUrls():
            event.acceptProposedAction()
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
    
    def dragLeaveEvent(self, event):
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
    
    def dropEvent(self, event: QDropEvent):
        urls = event.mimeData().urls()
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
    
    def mousePressEvent(self, event):
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
    def __init__(self):
        super().__init__()
        self.products = []
        self.drop_zones = {}
        self.output_folder = ""
        
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
        json_btn.clicked.connect(self.load_json)
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
        folder_btn.clicked.connect(self.select_output_folder)
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
        self.export_btn.clicked.connect(self.export_images)
        layout.addWidget(self.export_btn)
    
    def load_json(self):
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
                data = json.load(f)
            
            # Handle your JSON structure: products array
            self.products = data.get('products', [])
            
            if not self.products:
                QMessageBox.warning(self, "No Products", "No products found in JSON file.")
                return
            
            self.json_path_display.setText(file_path)
            self.render_products()
            
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to load JSON: {str(e)}")
    
    def render_products(self):
        # Clear existing widgets
        for i in reversed(range(self.products_layout.count())): 
            self.products_layout.itemAt(i).widget().setParent(None)
        
        self.drop_zones.clear()
        
        # Create product cards in grid
        for idx, product in enumerate(self.products):
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
            
            # Expected filename (from images.primary)
            expected_filename = product.get('images', {}).get('primary', f"product-{idx}.jpg")
            filename_label = QLabel(f"→ {expected_filename}")
            filename_label.setStyleSheet("font-family: 'Courier New'; font-size: 13px; color: #626c71;")
            card_layout.addWidget(filename_label)
            
            # Drop zone
            drop_zone = DropZone(product.get('name', ''), expected_filename)
            card_layout.addWidget(drop_zone)
            
            self.drop_zones[product.get('id', f'product-{idx}')] = {
                'zone': drop_zone,
                'expected': expected_filename
            }
            
            self.products_layout.addWidget(card, row, col)
        
        self.export_btn.setEnabled(True)
    
    def select_output_folder(self):
        folder = QFileDialog.getExistingDirectory(self, "Select Output Folder")
        if folder:
            self.output_folder = folder
            self.folder_path_display.setText(folder)
    
    def export_images(self):
        if not self.output_folder:
            QMessageBox.warning(self, "No Folder", "Please select an output folder first.")
            return
        
        output_path = Path(self.output_folder)
        if not output_path.exists():
            QMessageBox.warning(self, "Invalid Folder", "Selected folder does not exist.")
            return
        
        exported_count = 0
        
        for product_id, data in self.drop_zones.items():
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


def main():
    app = QApplication(sys.argv)
    window = ImageRenamerApp()
    window.show()
    sys.exit(app.exec())


if __name__ == '__main__':
    main()
