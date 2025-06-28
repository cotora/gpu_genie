resource "aws_dynamodb_table" "reservations" {
  name         = "${local.project_name}-reservations-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "user-id-index"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "status-index"
    hash_key        = "status"
    projection_type = "ALL"
  }

  tags = {
    Name = "${local.project_name}-reservations-${var.environment}"
  }
}

resource "aws_dynamodb_table" "users" {
  name         = "${local.project_name}-users-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  tags = {
    Name = "${local.project_name}-users-${var.environment}"
  }
}

resource "aws_dynamodb_table" "gpu_servers" {
  name         = "${local.project_name}-gpu-servers-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "gpuType"
    type = "S"
  }

  global_secondary_index {
    name            = "gpu-type-index"
    hash_key        = "gpuType"
    projection_type = "ALL"
  }

  tags = {
    Name = "${local.project_name}-gpu-servers-${var.environment}"
  }
}

# サンプルGPUサーバーデータを投入
resource "aws_dynamodb_table_item" "gpu_server_v100_1" {
  table_name = aws_dynamodb_table.gpu_servers.name
  hash_key   = aws_dynamodb_table.gpu_servers.hash_key

  item = jsonencode({
    id = {
      S = "server-v100-01"
    }
    name = {
      S = "GPU Server V100-01"
    }
    gpuType = {
      S = "V100"
    }
    totalGpus = {
      N = "8"
    }
    availableGpus = {
      N = "8"
    }
    status = {
      S = "active"
    }
  })
}

resource "aws_dynamodb_table_item" "gpu_server_a100_1" {
  table_name = aws_dynamodb_table.gpu_servers.name
  hash_key   = aws_dynamodb_table.gpu_servers.hash_key

  item = jsonencode({
    id = {
      S = "server-a100-01"
    }
    name = {
      S = "GPU Server A100-01"
    }
    gpuType = {
      S = "A100"
    }
    totalGpus = {
      N = "4"
    }
    availableGpus = {
      N = "4"
    }
    status = {
      S = "active"
    }
  })
}

resource "aws_dynamodb_table_item" "gpu_server_rtx3090_1" {
  table_name = aws_dynamodb_table.gpu_servers.name
  hash_key   = aws_dynamodb_table.gpu_servers.hash_key

  item = jsonencode({
    id = {
      S = "server-rtx3090-01"
    }
    name = {
      S = "GPU Server RTX3090-01"
    }
    gpuType = {
      S = "RTX3090"
    }
    totalGpus = {
      N = "6"
    }
    availableGpus = {
      N = "6"
    }
    status = {
      S = "active"
    }
  })
}