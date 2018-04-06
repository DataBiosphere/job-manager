import "MockSmartSeq2SingleSample.wdl" as MockSmartSeq2

workflow TestAdapterSmartSeq2SingleCell {
  meta {
    description: "This is a hello-world workflow for test purposes only."
  }

  # load annotation
  String gtf_file
  String genome_ref_fasta
  String rrna_intervals
  String gene_ref_flat

  # load index
  String hisat2_ref_index
  String hisat2_ref_trans_index
  String rsem_ref_index

  # ref index name
  String hisat2_ref_name
  String hisat2_ref_trans_name

  # samples
  String stranded

  # adapter parameters
  String format_map
  String dss_url
  String submit_url
  String method
  String run_type
  String reference_bundle
  String schema_version
  Int retry_seconds
  Int timeout_seconds
  String? opt_docker

  # runtime values
  String docker = select_first([opt_docker, "python:3.6-slim"])

  parameter_meta {
    gtf_file: "Description Placeholder"
    genome_ref_fasta: "Description Placeholder"
    rrna_intervals: "Description Placeholder"
    gene_ref_flat: "Description Placeholder"
    hisat2_ref_index: "Description Placeholder"
    hisat2_ref_trans_index: "Description Placeholder"
    rsem_ref_index: "Description Placeholder"
    hisat2_ref_name: "Description Placeholder"
    hisat2_ref_trans_name: "Description Placeholder"
    stranded: "Description Placeholder"
    format_map: "Description Placeholder"
    dss_url: "Description Placeholder"
    submit_url: "Description Placeholder"
    method: "Description Placeholder"
    run_type: "Description Placeholder"
    reference_bundle: "Description Placeholder"
    schema_version: "Description Placeholder"
    retry_seconds: "Description Placeholder"
    timeout_seconds: "Description Placeholder"
    opt_docker: "optionally provide a docker to run in"
  }

  call MockSmartSeq2.MockSmartSeq2SingleCell as analysis {
    input:
      genome_ref_fasta = genome_ref_fasta,
      gtf_file = gtf_file,
      rrna_intervals = rrna_intervals,
      ref_flat = gene_ref_flat,
      hisat2_ref = hisat2_ref_index,
      hisat2_trans_ref = hisat2_ref_trans_index,
      rsem_genome = rsem_ref_index,
      ref_name = hisat2_ref_name,
      ref_trans_name = hisat2_ref_trans_name,
      stranded = stranded,
      opt_docker = docker
  }

  call TestAdapterSmartSeq2SingleCellTask {
    input:
      analysis_result_1 = analysis.mocksmartseq2singlecell_output_a,
      analysis_result_2 = analysis.mocksmartseq2singlecell_output_b,
      analysis_result_3 = analysis.mocksmartseq2singlecell_output_c,
      analysis_result_4 = analysis.mocksmartseq2singlecell_output_d,
      format_map = format_map,
      dss_url = dss_url,
      submit_url = submit_url,
      method = method,
      run_type = run_type,
      reference_bundle = reference_bundle,
      schema_version = schema_version,
      retry_seconds = retry_seconds,
      timeout_seconds = timeout_seconds,
      docker = docker
  }
} 

task TestAdapterSmartSeq2SingleCellTask {
  String analysis_result_1
  String analysis_result_2
  String analysis_result_3
  String analysis_result_4
  String format_map
  String dss_url
  String submit_url
  String method
  String run_type
  String reference_bundle
  String schema_version
  Int retry_seconds
  Int timeout_seconds
  String docker

  parameter_meta {
    analysis_result_1: "Description Placeholder"
    analysis_result_2: "Description Placeholder"
    analysis_result_3: "Description Placeholder"
    analysis_result_4: "Description Placeholder"
    format_map: "Description Placeholder"
    dss_url: "Description Placeholder"
    submit_url: "Description Placeholder"
    method: "Description Placeholder"
    run_type: "Description Placeholder"
    reference_bundle: "Description Placeholder"
    schema_version: "Description Placeholder"
    retry_seconds: "Description Placeholder"
    timeout_seconds: "Description Placeholder"
    docker: "Description Placeholder"
  }

  command {
    echo "Analysis Result 1: "${analysis_result_1}
    echo "Analysis Result 2: "${analysis_result_2}
    echo "Analysis Result 3: "${analysis_result_3}
    echo "Analysis Result 4: "${analysis_result_4}
    echo "String: "${format_map}
    echo "String: "${dss_url}
    echo "String: "${submit_url}
    echo "String: "${method}
    echo "String: "${run_type}
    echo "String: "${reference_bundle}
    echo "String: "${schema_version}
    echo "Int: "${retry_seconds}
    echo "Int: "${timeout_seconds}

    python <<CODE
    chars = """
    ______      _   _
    | ___ \    | | | |
    | |_/ /   _| |_| |__   ___  _ __
    |  __/ | | | __| '_ \ / _ \| '_ \
    | |  | |_| | |_| | | | (_) | | | |
    \_|   \__, |\__|_| |_|\___/|_| |_|
           __/ |
          |___/ """

    print(chars)
    CODE
  }

  runtime {
    docker: docker
    memory: "100 MB"
    disks: "local-disk 10 HDD"
    cpu: "1"
    preemptible: 5
  }
}
