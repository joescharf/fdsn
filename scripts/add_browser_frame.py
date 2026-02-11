#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow"]
# ///
"""Add macOS-style browser frames to screenshots.

Usage:
    uv run scripts/add_browser_frame.py input.png -o output.png
    uv run scripts/add_browser_frame.py input_dir/ -o output_dir/
    uv run scripts/add_browser_frame.py input.png --title "Antelope Cloud" --shadow
"""

from PIL import Image, ImageDraw, ImageFilter, ImageFont
from pathlib import Path
import argparse
import sys

# Frame styling constants
TITLE_BAR_HEIGHT = 32
BUTTON_RADIUS = 6
BUTTON_SPACING = 8
BUTTON_LEFT_MARGIN = 12
BUTTON_COLORS = ["#ff5f57", "#febc2e", "#28c840"]  # Close, minimize, maximize
TITLE_BAR_COLOR = (232, 232, 232)  # #e8e8e8
BORDER_COLOR = (200, 200, 200)  # Light gray border
CORNER_RADIUS = 10
SHADOW_OFFSET = 4
SHADOW_BLUR = 12
SHADOW_COLOR = (0, 0, 0, 80)  # Semi-transparent black
PADDING = 20  # Padding around the framed image for shadow
SUPERSAMPLE_SCALE = 3  # Render at 3x for anti-aliasing, then downscale


def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert hex color to RGB tuple."""
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


def draw_rounded_rectangle(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int, int, int],
    radius: int,
    fill=None,
    outline=None,
    width: int = 1,
):
    """Draw a rounded rectangle."""
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def create_title_bar_supersampled(
    width: int,
    height: int,
    corner_radius: int,
    title: str | None = None,
) -> Image.Image:
    """Create an anti-aliased title bar using supersampling.

    Renders at higher resolution then downscales for smooth edges.
    """
    scale = SUPERSAMPLE_SCALE
    hi_width = width * scale
    hi_height = height * scale
    hi_radius = corner_radius * scale
    hi_button_radius = BUTTON_RADIUS * scale
    hi_button_spacing = BUTTON_SPACING * scale
    hi_button_margin = BUTTON_LEFT_MARGIN * scale

    # Create high-res title bar
    title_bar = Image.new("RGBA", (hi_width, hi_height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(title_bar)

    # Draw rounded rectangle for title bar (rounded top, square bottom)
    draw.rounded_rectangle(
        (0, 0, hi_width, hi_height),
        radius=hi_radius,
        fill=TITLE_BAR_COLOR + (255,),
    )
    # Square off the bottom corners
    draw.rectangle(
        (0, hi_height - hi_radius, hi_width, hi_height),
        fill=TITLE_BAR_COLOR + (255,),
    )

    # Draw traffic light buttons
    button_y = hi_height // 2
    for i, color in enumerate(BUTTON_COLORS):
        button_x = hi_button_margin + i * (hi_button_radius * 2 + hi_button_spacing)
        rgb = hex_to_rgb(color)
        draw.ellipse(
            (
                button_x - hi_button_radius,
                button_y - hi_button_radius,
                button_x + hi_button_radius,
                button_y + hi_button_radius,
            ),
            fill=rgb,
        )

    # Draw title text if provided
    if title:
        try:
            font = ImageFont.truetype(
                "/System/Library/Fonts/SF-Pro-Text-Medium.otf", 13 * scale
            )
        except OSError:
            try:
                font = ImageFont.truetype(
                    "/System/Library/Fonts/Helvetica.ttc", 13 * scale
                )
            except OSError:
                font = ImageFont.load_default()

        text_bbox = draw.textbbox((0, 0), title, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        text_x = (hi_width - text_width) // 2
        text_y = (hi_height - text_height) // 2
        draw.text((text_x, text_y), title, fill=(80, 80, 80), font=font)

    # Draw bottom border line
    draw.line((0, hi_height - scale, hi_width, hi_height - scale), fill=BORDER_COLOR, width=scale)

    # Downscale with high-quality resampling
    return title_bar.resize((width, height), Image.Resampling.LANCZOS)


def create_browser_frame(
    image_path: Path,
    output_path: Path,
    title: str | None = None,
    shadow: bool = True,
    corner_radius: int = CORNER_RADIUS,
) -> Path:
    """Add a macOS-style browser frame to an image.

    Args:
        image_path: Path to the input image
        output_path: Path for the output image
        title: Optional title text for the title bar
        shadow: Whether to add a drop shadow
        corner_radius: Radius for rounded corners

    Returns:
        Path to the created output file
    """
    # Load the source image
    source = Image.open(image_path).convert("RGBA")
    src_width, src_height = source.size

    # Calculate dimensions
    frame_width = src_width
    frame_height = src_height + TITLE_BAR_HEIGHT

    # Calculate canvas size (with padding for shadow)
    if shadow:
        canvas_width = frame_width + (PADDING * 2)
        canvas_height = frame_height + (PADDING * 2)
        offset_x = PADDING
        offset_y = PADDING
    else:
        canvas_width = frame_width
        canvas_height = frame_height
        offset_x = 0
        offset_y = 0

    # Create the final canvas with transparency
    final = Image.new("RGBA", (canvas_width, canvas_height), (0, 0, 0, 0))
    shadow_canvas: Image.Image | None = None

    # Create shadow if enabled (using supersampling for smooth edges)
    if shadow:
        scale = SUPERSAMPLE_SCALE
        hi_canvas = Image.new(
            "RGBA", (canvas_width * scale, canvas_height * scale), (0, 0, 0, 0)
        )
        hi_draw = ImageDraw.Draw(hi_canvas)

        shadow_rect = (
            (offset_x + SHADOW_OFFSET) * scale,
            (offset_y + SHADOW_OFFSET) * scale,
            (offset_x + frame_width + SHADOW_OFFSET) * scale,
            (offset_y + frame_height + SHADOW_OFFSET) * scale,
        )
        hi_draw.rounded_rectangle(
            shadow_rect, radius=corner_radius * scale, fill=SHADOW_COLOR
        )

        # Downscale then blur
        shadow_canvas = hi_canvas.resize(
            (canvas_width, canvas_height), Image.Resampling.LANCZOS
        )
        shadow_canvas = shadow_canvas.filter(ImageFilter.GaussianBlur(SHADOW_BLUR))
        final = Image.alpha_composite(final, shadow_canvas)

    # Create the white content background with rounded corners (supersampled)
    scale = SUPERSAMPLE_SCALE
    hi_bg = Image.new(
        "RGBA", (canvas_width * scale, canvas_height * scale), (0, 0, 0, 0)
    )
    hi_bg_draw = ImageDraw.Draw(hi_bg)

    frame_rect_hi = (
        offset_x * scale,
        offset_y * scale,
        (offset_x + frame_width) * scale,
        (offset_y + frame_height) * scale,
    )
    hi_bg_draw.rounded_rectangle(
        frame_rect_hi, radius=corner_radius * scale, fill=(255, 255, 255, 255)
    )

    bg_layer = hi_bg.resize((canvas_width, canvas_height), Image.Resampling.LANCZOS)
    final = Image.alpha_composite(final, bg_layer)

    # Create anti-aliased title bar
    title_bar = create_title_bar_supersampled(
        frame_width, TITLE_BAR_HEIGHT, corner_radius, title
    )

    # Paste title bar
    final.paste(title_bar, (offset_x, offset_y), title_bar)

    # Paste the source image into the content area
    content_position = (offset_x, offset_y + TITLE_BAR_HEIGHT)
    final.paste(source, content_position)

    # Create rounded corner mask for bottom of content (supersampled)
    hi_mask = Image.new("L", (canvas_width * scale, canvas_height * scale), 0)
    hi_mask_draw = ImageDraw.Draw(hi_mask)

    content_rect_hi = (
        offset_x * scale,
        (offset_y + TITLE_BAR_HEIGHT) * scale,
        (offset_x + frame_width) * scale,
        (offset_y + frame_height) * scale,
    )
    hi_mask_draw.rounded_rectangle(
        content_rect_hi, radius=corner_radius * scale, fill=255
    )
    # Square off the top
    hi_mask_draw.rectangle(
        (
            offset_x * scale,
            (offset_y + TITLE_BAR_HEIGHT) * scale,
            (offset_x + frame_width) * scale,
            (offset_y + TITLE_BAR_HEIGHT + corner_radius) * scale,
        ),
        fill=255,
    )

    content_mask = hi_mask.resize((canvas_width, canvas_height), Image.Resampling.LANCZOS)

    # Apply rounded corners to content
    content_layer = Image.new("RGBA", (canvas_width, canvas_height), (0, 0, 0, 0))
    content_layer.paste(source, content_position)

    # Composite with mask
    final_with_content = Image.new("RGBA", (canvas_width, canvas_height), (0, 0, 0, 0))

    # Re-add shadow
    if shadow and shadow_canvas is not None:
        final_with_content = Image.alpha_composite(final_with_content, shadow_canvas)

    # Add background
    final_with_content = Image.alpha_composite(final_with_content, bg_layer)

    # Add title bar
    title_bar_layer = Image.new("RGBA", (canvas_width, canvas_height), (0, 0, 0, 0))
    title_bar_layer.paste(title_bar, (offset_x, offset_y), title_bar)
    final_with_content = Image.alpha_composite(final_with_content, title_bar_layer)

    # Add content with mask
    final_with_content.paste(content_layer, (0, 0), content_mask)

    # Save the result
    output_path.parent.mkdir(parents=True, exist_ok=True)
    final_with_content.save(output_path, "PNG")
    return output_path


def process_batch(
    input_path: Path,
    output_path: Path,
    title: str | None = None,
    shadow: bool = True,
    corner_radius: int = CORNER_RADIUS,
    keep_name: bool = False,
) -> list[Path]:
    """Process a single file or all images in a directory.

    Args:
        input_path: Path to input file or directory
        output_path: Path to output file or directory
        title: Optional title for the title bar
        shadow: Whether to add drop shadows
        corner_radius: Radius for rounded corners

    Returns:
        List of created output file paths
    """
    image_extensions = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"}
    created_files = []

    if input_path.is_file():
        # Single file processing
        if output_path.is_dir() or str(output_path).endswith("/"):
            suffix = "" if keep_name else "_framed"
            output_file = output_path / f"{input_path.stem}{suffix}.png"
        else:
            output_file = output_path

        result = create_browser_frame(
            input_path, output_file, title=title, shadow=shadow, corner_radius=corner_radius
        )
        created_files.append(result)
        print(f"Created: {result}")

    elif input_path.is_dir():
        # Batch directory processing
        output_path.mkdir(parents=True, exist_ok=True)
        suffix = "" if keep_name else "_framed"

        for img_path in sorted(input_path.iterdir()):
            if img_path.suffix.lower() in image_extensions:
                output_file = output_path / f"{img_path.stem}{suffix}.png"
                result = create_browser_frame(
                    img_path,
                    output_file,
                    title=title,
                    shadow=shadow,
                    corner_radius=corner_radius,
                )
                created_files.append(result)
                print(f"Created: {result}")

    else:
        print(f"Error: {input_path} does not exist", file=sys.stderr)
        sys.exit(1)

    return created_files


def main():
    parser = argparse.ArgumentParser(
        description="Add macOS-style browser frames to screenshots",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    uv run scripts/add_browser_frame.py screenshot.png -o framed.png
    uv run scripts/add_browser_frame.py images/ -o framed/
    uv run scripts/add_browser_frame.py demo.png --title "Antelope Cloud" --no-shadow
        """,
    )
    parser.add_argument("input", type=Path, help="Input image file or directory")
    parser.add_argument(
        "-o", "--output", type=Path, required=True, help="Output file or directory"
    )
    parser.add_argument("--title", type=str, help="Title text for the title bar")
    parser.add_argument(
        "--no-shadow", action="store_true", help="Disable drop shadow"
    )
    parser.add_argument(
        "--radius",
        type=int,
        default=CORNER_RADIUS,
        help=f"Corner radius in pixels (default: {CORNER_RADIUS})",
    )
    parser.add_argument(
        "--keep-name",
        action="store_true",
        help="Keep original filename without adding '_framed' suffix",
    )

    args = parser.parse_args()

    created = process_batch(
        args.input,
        args.output,
        title=args.title,
        shadow=not args.no_shadow,
        corner_radius=args.radius,
        keep_name=args.keep_name,
    )

    print(f"\nProcessed {len(created)} image(s)")


if __name__ == "__main__":
    main()
