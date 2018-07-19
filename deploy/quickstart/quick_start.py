import os
from os import path
import urllib.request
from subprocess import call
import subprocess


def quick_start():
    version = "v0.2.0"

    home = os.getenv("HOME")
    install_dir = request_input_path("Select an installation directory", home + "/jmui")

    bin_dir = install_dir + "/bin"
    make_or_replace_or_reuse_directory(bin_dir)

    config_dir = install_dir + "/config"
    make_or_replace_or_reuse_directory(config_dir)

    os.chdir(install_dir)

    service_type = request_input_from_list("Select a shim to use", ["Cromwell", "dsub"], "Cromwell")
    options = {
        "Cromwell": quick_start_cromwell
    }
    options[service_type](version, install_dir, bin_dir, config_dir)


def quick_start_cromwell(version, install_dir, bin_dir, config_dir):
    os.chdir(bin_dir)

    capabilities_config = download_file(version, "deploy/cromwell/capabilities-config.json", "capabilities-config.json")
    docker_compose = download_file(version, "deploy/cromwell/docker-compose/cromwell-compose-template.yml", "docker-compose.yml")
    nginx = download_file(version, "deploy/cromwell/docker-compose/nginx.conf", "nginx.json")
    ui_config = download_file(version, "deploy/ui-config.json", "ui-config.json")

    os.chdir(config_dir)
    api_config = download_file(version, "deploy/cromwell/api-config.json", "api-config.json")
    cromwell_url = request_input_with_help("Enter the raw Cromwell IP address, eg '10.1.10.100' (DO NOT USE LOCALHOST or 127.0.0.1)!", cromwell_service_clue)

    os.chdir(install_dir)
    start_script_file= install_dir + "/jmui_start.sh"
    start_script_contents = [
        "if docker ps | grep job-manager",
        "then",
        "echo \"Stopping current instance(s)\"",
        "docker stop $(docker ps | grep \"job-manager\" | awk '{ print $1 }')",
        "fi",
        "export CROMWELL_URL=http://" + cromwell_url + ":8000/api/workflows/v1",
        "docker-compose -f " + docker_compose + " up"
    ]
    write_string(start_script_file, start_script_contents)
    call(["chmod", "+x", start_script_file])

    replace_in_file(docker_compose, "image: job-manager", "image: databiosphere/job-manager")

    shim_type = request_input_from_list("Setting up for single-instance or against Caas?", ["instance", "caas"], "instance")
    if shim_type == "instance":
        replace_in_file(docker_compose, "../../ui-config.json", ui_config)
        replace_in_file(docker_compose, "./nginx.conf", nginx)
        replace_in_file(docker_compose, "../capabilities-config.json", capabilities_config)
        replace_in_file(docker_compose, "../api-config.json", api_config)
        replace_in_file(docker_compose, "USE_CAAS=True", "USE_CAAS=False")

        # This will obviously fail if the capabilities config gets any more
        # than one default-required field like this:
        replace_in_file(capabilities_config, "\"isRequired\": true", "\"isRequired\": false")

        print("To start, run:")
        print("> " + start_script_file)

    else:
        print("Sorry, not yet implemented! Please raise this issue at https://github.com/DataBiosphere/job-manager/issues")
        exit(1)


def quick_start_dsub():
    print("Sorry, not yet implemented! Please raise this issue at https://github.com/DataBiosphere/job-manager/issues")


def download_file(version, file, to_path):
    abs_to_path = path.abspath(to_path)
    from_url = "https://raw.githubusercontent.com/DataBiosphere/job-manager/" + version + "/" + file
    urllib.request.urlretrieve(from_url, abs_to_path)
    return abs_to_path


def replace_in_file(file, to_replace, replace_with):
    with open(file, "rt") as fin:
        temp = "temp_out.txt"
        with open("temp_out.txt", "wt") as fout:
            for line in fin:
                fout.write(line.replace(to_replace, replace_with))
        call(["mv", "-f", temp, file])


def write_string(file, lines):
    with open(file, "wt") as fout:
        for line in lines:
            fout.writelines(line + "\n")


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

    printed_options_list = "(" + "/".join(str(e) for e in all_options) + ")"

    while not valid:
        provided = input(">> " + message + " " + printed_options_list + " [ " + default + " ] > ") or default
        if provided in all_options:
            valid = True
        else:
            print("Invalid option. Expected one of: " + printed_options_list + " but got: " + provided)
            valid = False
    print("Using: " + provided)
    print()
    return provided


def make_or_replace_or_reuse_directory(path_to_make):
    valid = False
    time_to_exit = False
    while not time_to_exit:
        if path.isdir(path_to_make):
            print("Directory " + path_to_make + " already exists. I can...")
            print("1. Default: Re-use the existing directory which might leave behind some old files")
            print("2. Delete the entire directory and all of its contents - and then remake it, completely empty")
            provided = input("Replace or re-use? (1/2) [ 1 ] > ") or "1"
            if provided is 1:
                valid = True
                time_to_exit = True
            elif provided is 2:
                try:
                    call(["rm", "-rf", provided])
                    os.mkdir(provided)
                    valid = True
                    time_to_exit = True
                except OSError as e:
                    print("OS error: " + e)
                    valid = False
                    time_to_exit = True
            else:
                print("Invalid input: got " + provided + " but expected one of (1/2)")
                valid = False
                time_to_exit = False
        else:
            try:
                os.mkdir(path_to_make)
                valid = True
            except OSError as e:
                print("OS error: " + e)
                valid = False
                time_to_exit = False

    if not valid:
        print("Cannot continue. Exiting")
        exit(1)


def request_input_path(message, default):
    valid = False
    absolute_path = path.abspath(default)
    while not valid:
        provided = input(">> " + message + " [ " + absolute_path + " ] > ") or absolute_path
        absolute_path = path.abspath(provided)
        print("Using: " + provided)

        make_or_replace_or_reuse_directory(provided)

    return absolute_path


def request_input_with_help(message, clue):
    valid = False
    provided = None
    while not valid:
        provided = input(">> " + message + " (type 'clue' or leave empty for help) > ") or "clue"
        if provided == "clue":
            clue()
            provided = ""
            continue
        else:
            valid = True
    print("Using: " + provided)
    return provided


def cromwell_service_clue():
    print("Checking for local interfaces (one of these might be useful):")
    print()
    call(["sh", "-c", "ifconfig | grep 'inet ' | grep -v 127.0.0.1"])
    print()


quick_start()
