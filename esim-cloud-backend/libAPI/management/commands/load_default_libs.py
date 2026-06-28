from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from libAPI.lib_utils import save_libs
from libAPI.kicad_sym_utils import save_kicad_sym_libs
from libAPI.models import LibrarySet
from esimCloud import settings
import os
import logging
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Load default libraries if not already present."

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            help='input a user\'s username', type=str
        )
        parser.add_argument(
            '--location', type=self.dir_path,
            help="Directory containing library files"
        )
        parser.add_argument(
            '--default', action='store_true',
            help="set if the library is default or not"
        )
        parser.add_argument(
            '--svg-dir', type=str, default='',
            help="Directory containing pre-generated SVGs (for .kicad_sym)"
        )

    def dir_path(self, path):
        if os.path.isdir(path):
            return path
        raise Exception(f"{path} is not a valid path")

    def handle(self, *args, **options):
        User = get_user_model()
        if options['username']:
            user = User.objects.get(username=options['username'])
        else:
            raise Exception("Enter a superuser to associate libs")

        name = 'esim-default' if options['default'] else 'esim-additional'
        library_set = LibrarySet.objects.filter(
            user=user,
            default=options['default'],
            name=name
        ).first()
        if not library_set:
            library_set = LibrarySet(
                user=user,
                default=True if options['default'] else False,
                name=name
            )
            library_set.save()

        out_location = os.path.join(
            "kicad-symbols/",
            library_set.user.username + "-" + name
        )
        logger.info(f"Reading libraries from {options['location']}")
        logger.info(f"Saving as " + name[5:])
        logger.info(f"Saving Libraries to {out_location}")
        if not os.path.isdir(out_location):
            os.mkdir(out_location)

        files = os.listdir(options['location'])
        kicad_sym_files = [f for f in files if f.endswith('.kicad_sym')]
        lib_files = [f for f in files if f.endswith('.lib') or f.endswith('.dcm')]

        # Handle .kicad_sym files
        if kicad_sym_files:
            svg_base_dir = options.get('svg_dir', '')
            for sym_file in kicad_sym_files:
                sym_path = os.path.join(options['location'], sym_file)
                lib_base = sym_file[:-10]
                if svg_base_dir and os.path.isdir(os.path.join(svg_base_dir, lib_base)):
                    svg_dir = os.path.join(svg_base_dir, lib_base)
                else:
                    svg_dir = os.path.join(options['location'], lib_base)
                if not os.path.isdir(svg_dir):
                    logger.warning(f"SVG dir not found for {sym_file}: {svg_dir}")
                    continue
                logger.info(f"Processing {sym_file} with SVGs from {svg_dir}")
                try:
                    save_kicad_sym_libs(sym_path, svg_dir, out_location, library_set)
                except Exception as e:
                    logger.error(f"Error processing {sym_file}: {e}")

        # Handle .lib files (existing behavior)
        if lib_files:
            try:
                save_libs(files, options['location'], out_location, library_set)
            except Exception:
                logger.error("Couldn't save all the libs")

        logger.info("Finished without errors")
