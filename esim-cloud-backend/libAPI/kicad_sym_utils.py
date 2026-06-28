import os
import re
import shutil
import logging

from libAPI.models import Library, LibraryComponent

logger = logging.getLogger(__name__)


def _parse_kicad_sym_file(sym_path):
    """
    Parse a .kicad_sym file and return a list of dicts, one per
    top-level symbol (derived units like R_1_1 are skipped):
      { name, description, keywords, datasheet, prefix }
    """
    with open(sym_path, 'r', encoding='utf-8', errors='replace') as f:
        text = f.read()

    symbols = []

    outer_start = text.find('(kicad_symbol_lib')
    if outer_start == -1:
        logger.warning(f"Not a valid .kicad_sym file: {sym_path}")
        return symbols

    i = outer_start + 1
    n = len(text)
    depth = 1

    while i < n and depth > 0:
        if text[i] == '(':
            if depth == 1:
                token_match = re.match(r'\((\w+)\s+"([^"]+)"', text[i:i+200])
                if token_match and token_match.group(1) == 'symbol':
                    sym_name = token_match.group(2)
                    # Find balanced end of this block
                    bd = 0
                    j = i
                    while j < n:
                        if text[j] == '(':
                            bd += 1
                        elif text[j] == ')':
                            bd -= 1
                            if bd == 0:
                                break
                        j += 1
                    block = text[i:j+1]
                    # Skip derived units (e.g. R_1_1)
                    if not re.search(r'_\d+_\d+$', sym_name):
                        symbols.append(_extract_sym_metadata(sym_name, block))
                    i = j + 1
                    depth = 1
                    continue
            depth += 1
        elif text[i] == ')':
            depth -= 1
        i += 1

    return symbols


def _extract_sym_metadata(name, block):
    description = ''
    keywords = ''
    datasheet = ''
    prefix = ''

    m = re.search(r'\(property\s+"Description"\s+"([^"]*)"', block)
    if m:
        description = m.group(1)

    m = re.search(r'\(property\s+"Keywords"\s+"([^"]*)"', block)
    if m:
        keywords = m.group(1)

    m = re.search(r'\(property\s+"Datasheet"\s+"([^"]*)"', block)
    if m:
        datasheet = m.group(1)
        if datasheet.strip() in ('~', ''):
            datasheet = ''

    m = re.search(r'\(property\s+"Reference"\s+"([^"]*)"', block)
    if m:
        prefix = m.group(1).replace('?', '').strip()

    return {
        'name': name,
        'description': description[:400],
        'keywords': keywords[:200],
        'datasheet': datasheet[:200],
        'prefix': prefix[:10],
    }


def save_kicad_sym_libs(sym_path, svg_dir, out_location, library_set):
    """
    Register a .kicad_sym library into the eSim DB.

    sym_path     -- path to the .kicad_sym file
    svg_dir      -- directory containing pre-generated SVGs named
                    <SymbolName>.svg and <SymbolName>_thumbnail.svg
    out_location -- base output directory (same as used by save_libs)
    library_set  -- LibrarySet instance
    """
    sym_filename = os.path.basename(sym_path)   # e.g. Device.kicad_sym
    lib_base = sym_filename[:-10]               # e.g. Device

    dest_svg_folder = os.path.join(out_location, 'symbol-svgs', lib_base)
    os.makedirs(dest_svg_folder, exist_ok=True)

    symbols = _parse_kicad_sym_file(sym_path)
    if not symbols:
        logger.warning(f"No symbols found in {sym_path}")
        return

    library = Library.objects.filter(
        library_name=sym_filename,
        library_set=library_set
    ).first()
    if not library:
        library = Library(library_name=sym_filename, library_set=library_set)
    library.save()

    registered = 0
    skipped = 0

    for sym in symbols:
        name = sym['name']

        src_svg = os.path.join(svg_dir, f"{name}.svg")
        src_thumb = os.path.join(svg_dir, f"{name}_thumbnail.svg")

        if not os.path.isfile(src_svg):
            logger.warning(f"SVG not found for {name}, skipping: {src_svg}")
            skipped += 1
            continue

        if not os.path.isfile(src_thumb):
            src_thumb = src_svg

        dest_svg = os.path.join(dest_svg_folder, f"{name}.svg")
        dest_thumb = os.path.join(dest_svg_folder, f"{name}_thumbnail.svg")

        shutil.copy2(src_svg, dest_svg)
        shutil.copy2(src_thumb, dest_thumb)

        datasheet = sym['datasheet']
        if datasheet and not datasheet.startswith(('http://', 'https://')):
            datasheet = ''

        component = LibraryComponent.objects.filter(
            name=name,
            component_library=library
        ).first()
        if not component:
            component = LibraryComponent(
                name=name,
                svg_path=dest_svg,
                thumbnail_path=dest_thumb,
                description=sym['description'],
                data_link=datasheet,
                full_name=name,
                keyword=sym['keywords'],
                symbol_prefix=sym['prefix'],
                component_library=library
            )
        else:
            component.svg_path = dest_svg
            component.thumbnail_path = dest_thumb
            component.description = sym['description']
            component.data_link = datasheet
            component.full_name = name
            component.keyword = sym['keywords']
            component.symbol_prefix = sym['prefix']
        component.save()
        registered += 1

    logger.info(f"{sym_filename}: registered {registered}, skipped {skipped}")
