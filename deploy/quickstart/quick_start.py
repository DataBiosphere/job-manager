import os
from os import path
import urllib.request
from subprocess import call
import subprocess


def quick_start():
    version = request_input_with_default("Select a version", 'v0.3.0')

    home = os.getenv('HOME')
    install_dir = request_input_path('Select an installation directory',
                                     '{0}/jmui'.format(home))

    bin_dir = '{0}/bin'.format(install_dir)
    make_or_replace_or_reuse_directory(bin_dir, exit_if_invalid=True)

    config_dir = '{0}/config'.format(install_dir)
    make_or_replace_or_reuse_directory(config_dir, exit_if_invalid=True)

    os.chdir(install_dir)

    service_type = request_input_from_list('Select a shim to use',
                                           ['Cromwell', 'dsub'], 'Cromwell')
    options = {'Cromwell': quick_start_cromwell, 'dsub': quick_start_dsub}
    options[service_type](version, install_dir, bin_dir, config_dir)


def quick_start_cromwell(version, install_dir, bin_dir, config_dir):
    os.chdir(bin_dir)

    capabilities_config = download_file(
        version, 'deploy/cromwell/capabilities-config.json',
        'capabilities-config.json')
    docker_compose = download_file(
        version,
        'deploy/cromwell/docker-compose/cromwell-compose-template.yml',
        'docker-compose.yml')
    nginx = download_file(version, 'deploy/cromwell/docker-compose/nginx.conf',
                          'nginx.json')
    ui_config = download_file(version, 'deploy/ui-config.json',
                              'ui-config.json')

    os.chdir(config_dir)
    api_config = download_file(version, 'deploy/cromwell/api-config.json',
                               'api-config.json')
    cromwell_ip = guess_local_ip()

    cromwell_url_guess = 'http://{0}:8000/api/workflows/v1'.format(cromwell_ip)
    cromwell_url = request_input_with_default("Enter the Cromwell URL",
                                              cromwell_url_guess)

    os.chdir(install_dir)
    start_script_file = '{0}/jmui_start.sh'.format(bin_dir)
    start_script_contents = [
        '#!/usr/bin/env bash', 'if docker ps | grep job-manager', 'then',
        'echo \'Stopping current instance(s)\'',
        'docker stop $(docker ps | grep \'job-manager\' | awk \'{ print $1 }\')',
        'fi', 'export CROMWELL_URL=\'{0}\''.format(cromwell_url),
        'docker-compose -f {0} up'.format(docker_compose)
    ]
    write_string(start_script_file, start_script_contents)
    call(['chmod', '+x', start_script_file])

    replace_in_file(docker_compose, 'image: job-manager',
                    'image: databiosphere/job-manager')
    replace_in_file(docker_compose, 'v0.2.0', version)

    shim_type = request_input_from_list(
        'Setting up for single-instance or against Caas?',
        ['instance', 'caas'], 'instance')
    if shim_type == 'instance':
        replace_in_file(docker_compose, '../../ui-config.json', ui_config)
        replace_in_file(docker_compose, './nginx.conf', nginx)
        replace_in_file(docker_compose, '../capabilities-config.json',
                        capabilities_config)
        replace_in_file(docker_compose, '../api-config.json', api_config)
        replace_in_file(docker_compose, 'USE_CAAS=True', 'USE_CAAS=False')

        # This will obviously fail if the capabilities config gets any more
        # than one default-required field like this:
        replace_in_file(capabilities_config, '"isRequired": true',
                        '"isRequired": false')

        print('To start, run:')
        print('> ' + start_script_file)

    else:
        print(
            'Sorry, not yet implemented! Please raise this issue at https://github.com/DataBiosphere/job-manager/issues'
        )
        exit(1)


def quick_start_dsub(version, install_dir, bin_dir, config_dir):
    print(
        'Sorry, not yet implemented! Please raise this issue at https://github.com/DataBiosphere/job-manager/issues'
    )
    exit(1)


def download_file(version, file, to_path):
    abs_to_path = path.abspath(to_path)
    from_url = 'https://raw.githubusercontent.com/DataBiosphere/job-manager/{0}/{1}'.format(
        version, file)
    urllib.request.urlretrieve(from_url, abs_to_path)
    return abs_to_path


def replace_in_file(file, to_replace, replace_with):
    with open(file, 'rt') as fin:
        temp = 'temp_out.txt'
        with open('temp_out.txt', 'wt') as fout:
            for line in fin:
                fout.write(line.replace(to_replace, replace_with))
        call(['mv', '-f', temp, file])


def write_string(file, lines):
    with open(file, 'wt') as fout:
        for line in lines:
            fout.writelines(line + '\n')


def pull_docker(name, version):
    docker_image = name + ':' + version
    print('Pulling docker image {0}'.format(docker_image))
    call(['docker', 'pull', docker_image], stdout=subprocess.DEVNULL)
    return docker_image


def request_input_from_list(message, options, default):
    valid = False
    provided = default
    if default not in options:
        all_options = options.copy()
        all_options = all_options + default
    else:
        all_options = options

    printed_options_list = '({0})'.format('/'.join(
        str(e) for e in all_options))

    while not valid:
        print()
        provided = input('>> {0} {1} [ {2} ] >'.format(
            message, printed_options_list, default)) or default
        if provided in all_options:
            valid = True
        else:
            print('Invalid option. Expected one of: {0} but got: {1}'.format(
                printed_options_list, provided))
            valid = False
    print('Using: ' + provided)
    print()
    return provided


def make_or_replace_or_reuse_directory(path_to_make, exit_if_invalid):
    print("Creating directory: {0}".format(path_to_make))
    valid = False
    time_to_exit = False
    if path.isdir(path_to_make):
        print()
        print('That directory already exists... I can...'.format(path_to_make))
        print(
            '1. Default: Re-use the existing directory which might leave behind some old files'
        )
        print(
            '2. Delete the entire directory and all of its contents - and then remake it, completely empty'
        )
    while not time_to_exit:
        if path.isdir(path_to_make):
            print()
            provided = input('Re-use or replace? (1/2) [ 1 ] > ') or '1'
            if provided == '1':
                valid = True
                time_to_exit = True
            elif provided == '2':
                try:
                    print('Removing {0} and its subdirectories'.format(
                        path_to_make))
                    call(['rm', '-rf', path_to_make])
                    print(
                        'Creating a new directory at {0}'.format(path_to_make))
                    os.mkdir(path_to_make)
                    valid = True
                    time_to_exit = True
                except OSError:
                    print('OS error clearing or remaking directory')
                    valid = False
                    time_to_exit = True
            else:
                print(
                    'Invalid input: got {0} but expected one of (1/2)'.format(
                        provided))
                valid = False
                time_to_exit = False
        else:
            try:
                os.mkdir(path_to_make)
                valid = True
                time_to_exit = True
            except OSError:
                print('OS error making directory')
                valid = False
                time_to_exit = True

    if not valid and exit_if_invalid:
        print('Cannot continue. Exiting')
        exit(1)

    return valid


def request_input_path(message, default):
    valid = False
    absolute_path = path.abspath(default)
    while not valid:
        print()
        provided = input('>> {0} [ {1} ] > '.format(
            message, absolute_path)) or absolute_path
        absolute_path = path.abspath(provided)
        print('Using: {0}'.format(provided))

        valid = make_or_replace_or_reuse_directory(
            provided, exit_if_invalid=False)

    return absolute_path


def request_input_with_help(message, clue):
    valid = False
    provided = None
    while not valid:
        print()
        provided = input('>> {0} (or "clue" for help) [ clue ] > '.format(
            message)) or 'clue'
        if provided == 'clue':
            clue()
            provided = ''
            continue
        else:
            valid = True
    print('Using: {0}'.format(provided))
    return provided


def request_input_with_default(message, default):
    print()
    provided = input('>> {0} [ {1} ] > '.format(message, default)) or default
    return provided


def guess_local_ip():
    default = '<IP ADDRESS>'
    try:
        result = subprocess.run([
            'sh', '-c',
            'ifconfig | grep \'inet \' | grep -v 127.0.0.1 | head -n1 | awk \'{print $2}\''
        ],
                                stdout=subprocess.PIPE)
        if result.returncode == 0:
            return result.stdout.decode('UTF-8').strip()
        else:
            print('Non-zero return code: {0}'.format(result.returncode))
            return default
    except Exception as e:
        print(e)
        return default


quick_start()
