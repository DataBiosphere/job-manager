import os
from os import path
import urllib.request


def quick_start():
    home = os.getenv("HOME")
    install_dir = request_input_path("Select an installation directory", home + "/jmui/")
    os.chdir(install_dir)
    shim_type = request_input_from_list("Select a shim to use", ["Cromwell", "dsub"], "Cromwell")
    options = {
        "Cromwell": quick_start_cromwell
    }
    options[shim_type](home)


def quick_start_cromwell(home):
    shim_type = request_input_from_list("Setting up for single-instance or against Caas?", ["instance", "caas"], "instance")

    docker_compose_target = home + "/docker-compose.yml"
    if shim_type == "instance":
        urllib.request.urlretrieve("https://raw.githubusercontent.com/DataBiosphere/job-manager/master/deploy/cromwell/docker-compose/cromwell-compose-template.yml", docker_compose_target)
        print("Downloaded docker-compose.yml as " + docker_compose_target)
    else:
        print("Sorry, not yet implemented! Please raise this issue at https://github.com/DataBiosphere/job-manager/issues")


def quick_start_dsub():
    print("Sorry, not yet implemented! Please raise this issue at https://github.com/DataBiosphere/job-manager/issues")


def request_input_from_list(message, options, default):
    valid = False
    provided = default
    if not default in options:
        printable_option_list = options.copy()
        all_options = options.copy()
        all_options = all_options + default
    else:
        all_options = options
        printable_option_list = options.copy()
        printable_option_list.remove(default)

    printable_option_list = ["DEFAULT: " + default ] + printable_option_list
    printed_options_list = "[ " + ", ".join(str(e) for e in printable_option_list) + " ]"

    while not valid:
        provided = input(">> " + message + " " + printed_options_list + " > ") or default
        if provided in all_options:
            valid = True
        else:
            print("Invalid option. Expected one of: " + printed_options_list + " but got: " + provided)
            valid = False
    print("Using: " + provided)
    print()
    return provided


def request_input_path(message, default):
    valid = False
    provided = default
    while not valid:
        provided = input(">> " + message + " [ DEFAULT: " + default + " ] > ") or default
        if path.isdir(provided):
            print("Directory exists: " + provided)
            valid = True
        else:
            try:
                print("Making directory: " + provided)
                os.mkdir(provided)
                valid = True
            except OSError:
                print("Unable to create directory: " + provided)
                valid = False
    print("Using: " + provided)
    print()
    return provided


quick_start()