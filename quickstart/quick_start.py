import os
from os import path
import urllib.request
from subprocess import call
import subprocess


def quick_start():
    version = request_input_from_list("Select a version to install", ["v0.2.0"], "v0.2.0")
    pull_docker("databiosphere/job-manager-ui", version)

    home = os.getenv("HOME")
    install_dir = request_input_path("Select an installation directory", home + "/jmui")
    os.chdir(install_dir)
    print("Downloading JMUI...")
    checkout_dir = install_dir + "/job-manager"
    call(["git", "clone", "https://github.com/DataBiosphere/job-manager.git"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("Downloaded JMUI to " + checkout_dir + " !")
    os.chdir(checkout_dir)
    call(["git", "fetch", "--tags"], stdout=subprocess.DEVNULL)
    call(["git", "checkout", "cjl_quick_start"], stdout=subprocess.DEVNULL)

    service_type = request_input_from_list("Select a shim to use", ["Cromwell", "dsub"], "Cromwell")
    options = {
        "Cromwell": quick_start_cromwell
    }
    options[service_type](version, checkout_dir)


def quick_start_cromwell(version, checkout_dir):
    os.chdir(checkout_dir)

    pull_docker("databiosphere/job-manager-api-cromwell", version)

    print("Linking quickstart/quickstart-common-compose to quickstart-common-compose.yml")
    call(["ln", "-s", checkout_dir + "/quickstart/quickstart-common-compose.yml", checkout_dir + "/quickstart-common-compose.yml"])
    shim_type = request_input_from_list("Setting up for single-instance or against Caas?", ["instance", "caas"], "instance")
    if shim_type == "instance":
        call(["ln", "-s", checkout_dir + "/quickstart/quickstart-cromwell-instance-compose.yml", checkout_dir + "/docker-compose.yml"])
    else:
        print("Sorry, not yet implemented! Please raise this issue at https://github.com/DataBiosphere/job-manager/issues")


def quick_start_dsub():
    print("Sorry, not yet implemented! Please raise this issue at https://github.com/DataBiosphere/job-manager/issues")


def pull_docker(name, version):
    docker_image = name + ":" + version
    print("Pulling docker image " + docker_image)
    call(["docker", "pull", docker_image], stdout=subprocess.DEVNULL)
    return docker_image


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