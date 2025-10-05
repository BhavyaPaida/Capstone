import logging

logging.basicConfig(filename='parser.log', level=logging.INFO,
                    format='%(asctime)s %(levelname)s:%(message)s')

def log_parsing_error(user_id, section, error):
    logging.error(f"User  {user_id} - Section '{section}' parsing failed: {error}")
