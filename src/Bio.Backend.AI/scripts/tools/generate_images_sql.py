import os
import argparse


def generate_sql(base_dir, public_bucket, output_sql):
    test_dir = os.path.join(base_dir, 'test')
    val_dir = os.path.join(base_dir, 'val')

    # We will use this set to keep track of species we've already written a thumbnail for
    processed_species = set()

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_sql), exist_ok=True)

    with open(output_sql, 'w', encoding='utf-8') as sql_file:
        sql_file.write("-- =========================================================\n")
        sql_file.write("-- SQL SCRIPT PARA POBLAR GALERIA DE IMAGENES\n")
        sql_file.write("-- Ejecutar en base de datos: BioCommerce_Scientific\n")
        sql_file.write("-- =========================================================\n\n")

        for ds_dir in [test_dir, val_dir]:
            if not os.path.exists(ds_dir):
                print(f"Directorio no encontrado: {ds_dir}")
                continue

            for species_folder in os.listdir(ds_dir):
                species_path = os.path.join(ds_dir, species_folder)
                if not os.path.isdir(species_path):
                    continue

                # Transform species_folder (e.g., Abracris_flavolineata) to scientific name
                scientific_name = species_folder.replace('_', ' ')

                # Iterate over image files in species directory
                images = [f for f in os.listdir(species_path)
                          if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

                if not images:
                    continue

                sql_file.write(f"-- Especie: {scientific_name}\n")

                for image in images:
                    # Construct S3 Object Key
                    s3_key = f"assets/images/species/{species_folder}/{image}"
                    s3_url = f"https://{public_bucket}.s3.amazonaws.com/{s3_key}"

                    # 1st image processed becomes the thumbnail
                    is_thumbnail = species_folder not in processed_species

                    # Generate INSERT for species_images
                    sql_file.write(
                        "INSERT INTO species_images (id, species_id, image_url, is_primary, "
                        "license_type, is_validated_by_expert, created_at) "
                        f"SELECT gen_random_uuid(), id, '{s3_url}', "
                        f"{'true' if is_thumbnail else 'false'}, 'Unknown', true, NOW() "
                        f"FROM species WHERE scientific_name = '{scientific_name}';\n"
                    )

                    # Generate UPDATE for species.thumbnail_url if it's the primary
                    if is_thumbnail:
                        sql_file.write(
                            f"UPDATE species SET thumbnail_url = '{s3_url}' "
                            f"WHERE scientific_name = '{scientific_name}';\n"
                        )
                        processed_species.add(species_folder)

                sql_file.write("\n")

    print(f"Script generado con exito: {output_sql}")


if __name__ == '__main__':
    # Directorio base de Bio.Backend.AI (dos niveles arriba de scripts/tools)
    base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

    parser = argparse.ArgumentParser(description="Generar SQL para imagenes subidas a S3")
    parser.add_argument(
        '--base_dir',
        default=os.path.join(base_path, 'data', 'processed'),
        help='Directorio base de dataset processed'
    )
    parser.add_argument(
        '--bucket',
        default='bioplatform-public',
        help='Nombre del bucket de S3 publico'
    )
    parser.add_argument(
        '--out',
        default=os.path.join(base_path, 'data', 'species_catalog', 'insert_species_images.sql'),
        help='Archivo SQL generado'
    )

    args = parser.parse_args()
    generate_sql(args.base_dir, args.bucket, args.out)
